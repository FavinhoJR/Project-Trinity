import { Router } from 'express';
const router = Router();

// GET /appointments - Listar citas con filtros avanzados
router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const { 
    estilista_id, 
    dia, 
    estado, 
    cliente_id,
    fecha_desde,
    fecha_hasta,
    page = 1, 
    limit = 50 
  } = req.query;
  
  const offset = (page - 1) * limit;
  
  try {
    let whereConditions = [];
    let params = [];
    let paramCount = 0;
    
    if (estilista_id) {
      paramCount++;
      whereConditions.push(`c.estilista_id = $${paramCount}`);
      params.push(estilista_id);
    }
    
    if (dia) {
      paramCount++;
      whereConditions.push(`DATE(c.fecha_inicio) = $${paramCount}::date`);
      params.push(dia);
    }
    
    if (estado) {
      paramCount++;
      whereConditions.push(`c.estado = $${paramCount}`);
      params.push(estado);
    }
    
    if (cliente_id) {
      paramCount++;
      whereConditions.push(`c.cliente_id = $${paramCount}`);
      params.push(cliente_id);
    }
    
    if (fecha_desde) {
      paramCount++;
      whereConditions.push(`c.fecha_inicio >= $${paramCount}::timestamptz`);
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      paramCount++;
      whereConditions.push(`c.fecha_inicio <= $${paramCount}::timestamptz`);
      params.push(fecha_hasta);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    params.push(limit, offset);
    const limitOffset = `LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    
    const query = `
      SELECT c.id, c.fecha_inicio, c.duracion_min, c.estado, c.cliente_id, c.estilista_id,
             cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono,
             u.email AS estilista_email,
             ARRAY_AGG(s.nombre) AS servicios,
             SUM(s.precio) AS precio_total
      FROM citas c
      JOIN clientes cl ON cl.id = c.cliente_id
      JOIN users u ON u.id = c.estilista_id
      LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
      LEFT JOIN servicios s ON s.id = sc.servicio_id
      ${whereClause}
      GROUP BY c.id, cl.nombre, cl.telefono, u.email
      ORDER BY c.fecha_inicio DESC
      ${limitOffset}
    `;
    
    const result = await db.query(query, params);
    
    // Contar total para paginación
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) 
      FROM citas c
      JOIN clientes cl ON cl.id = c.cliente_id
      JOIN users u ON u.id = c.estilista_id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params.slice(0, paramCount));
    
    res.json({
      appointments: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /appointments/:id - Obtener cita específica
router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT c.*, 
             cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono, cl.email AS cliente_email,
             u.email AS estilista_email,
             ARRAY_AGG(json_build_object('id', s.id, 'nombre', s.nombre, 'precio', s.precio, 'duracion_min', s.duracion_min)) AS servicios
      FROM citas c
      JOIN clientes cl ON cl.id = c.cliente_id
      JOIN users u ON u.id = c.estilista_id
      LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
      LEFT JOIN servicios s ON s.id = sc.servicio_id
      WHERE c.id = $1
      GROUP BY c.id, cl.nombre, cl.telefono, cl.email, u.email
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /appointments - Crear cita
router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const { cliente_id, estilista_id, servicio_ids = [], fecha_inicio, estado = 'pendiente', notas } = req.body;

  if (!cliente_id || !estilista_id || !fecha_inicio) {
    return res.status(400).json({ error: 'cliente_id, estilista_id y fecha_inicio son requeridos' });
  }

  if (servicio_ids.length === 0) {
    return res.status(400).json({ error: 'Debe seleccionar al menos un servicio' });
  }

  try {
    // Calcular duración total basada en servicios
    const serviciosResult = await db.query(
      'SELECT SUM(duracion_min) as duracion_total FROM servicios WHERE id = ANY($1)',
      [servicio_ids]
    );
    
    const duracion_min = serviciosResult.rows[0].duracion_total || 60;

    // Crear la cita
    const citaResult = await db.query(
      `INSERT INTO citas (cliente_id, estilista_id, fecha_inicio, duracion_min, estado, notas)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [cliente_id, estilista_id, fecha_inicio, duracion_min, estado, notas]
    );

    const citaId = citaResult.rows[0].id;

    // Asociar servicios
    for (const servicio_id of servicio_ids) {
    await db.query(
      'INSERT INTO servicio_citas (cita_id, servicio_id) VALUES ($1,$2)',
      [citaId, servicio_id]
    );
    }

    res.status(201).json({ id: citaId, message: 'Cita creada exitosamente' });
  } catch (e) {
    if (e.message.includes('Conflicto de horario')) {
      res.status(409).json({ error: 'Conflicto de horario: el estilista ya tiene una cita en ese horario' });
    } else {
    res.status(400).json({ error: e.message });
    }
  }
});

// PUT /appointments/:id - Actualizar cita
router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { cliente_id, estilista_id, servicio_ids, fecha_inicio, estado, notas } = req.body;

  try {
    // Verificar que la cita existe
    const existingCita = await db.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (existingCita.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    let duracion_min = existingCita.rows[0].duracion_min;
    
    // Si se cambian los servicios, recalcular duración
    if (servicio_ids && servicio_ids.length > 0) {
      const serviciosResult = await db.query(
        'SELECT SUM(duracion_min) as duracion_total FROM servicios WHERE id = ANY($1)',
        [servicio_ids]
      );
      duracion_min = serviciosResult.rows[0].duracion_total || duracion_min;
      
      // Actualizar servicios
      await db.query('DELETE FROM servicio_citas WHERE cita_id = $1', [id]);
      for (const servicio_id of servicio_ids) {
        await db.query(
          'INSERT INTO servicio_citas (cita_id, servicio_id) VALUES ($1,$2)',
          [id, servicio_id]
        );
      }
    }

    // Actualizar cita
    const updateResult = await db.query(
      `UPDATE citas 
       SET cliente_id = COALESCE($1, cliente_id),
           estilista_id = COALESCE($2, estilista_id),
           fecha_inicio = COALESCE($3, fecha_inicio),
           duracion_min = $4,
           estado = COALESCE($5, estado),
           notas = COALESCE($6, notas)
       WHERE id = $7
       RETURNING *`,
      [cliente_id, estilista_id, fecha_inicio, duracion_min, estado, notas, id]
    );

    res.json({ message: 'Cita actualizada exitosamente', cita: updateResult.rows[0] });
  } catch (e) {
    if (e.message.includes('Conflicto de horario')) {
      res.status(409).json({ error: 'Conflicto de horario: el estilista ya tiene una cita en ese horario' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// DELETE /appointments/:id - Cancelar/Eliminar cita
router.delete('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { force = false } = req.query; // force=true para eliminar completamente
  
  try {
    if (force === 'true') {
      // Eliminar completamente
      await db.query('DELETE FROM servicio_citas WHERE cita_id = $1', [id]);
      const result = await db.query('DELETE FROM citas WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }
      
      res.json({ message: 'Cita eliminada completamente' });
    } else {
      // Solo cambiar estado a cancelada
      const result = await db.query(
        'UPDATE citas SET estado = \'cancelada\' WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }
      
      res.json({ message: 'Cita cancelada', cita: result.rows[0] });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /appointments/calendar/:year/:month - Vista calendario
router.get('/calendar/:year/:month', async (req, res) => {
  const db = req.app.get('db');
  const { year, month } = req.params;
  const { estilista_id } = req.query;
  
  try {
    let whereClause = 'WHERE EXTRACT(YEAR FROM c.fecha_inicio) = $1 AND EXTRACT(MONTH FROM c.fecha_inicio) = $2';
    let params = [year, month];
    
    if (estilista_id) {
      whereClause += ' AND c.estilista_id = $3';
      params.push(estilista_id);
    }
    
    const result = await db.query(`
      SELECT c.id, c.fecha_inicio, c.duracion_min, c.estado, c.estilista_id,
             cl.nombre AS cliente_nombre,
             u.email AS estilista_email,
             ARRAY_AGG(s.nombre) AS servicios
         FROM citas c
         JOIN clientes cl ON cl.id = c.cliente_id
      JOIN users u ON u.id = c.estilista_id
      LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
      LEFT JOIN servicios s ON s.id = sc.servicio_id
      ${whereClause}
      GROUP BY c.id, cl.nombre, u.email
      ORDER BY c.fecha_inicio
    `, params);
    
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;