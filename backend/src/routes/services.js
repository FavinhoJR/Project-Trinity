import { Router } from 'express';
const router = Router();

// GET /services - Listar servicios
router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const { q = '', activo = null, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let whereConditions = [];
    let params = [];
    let paramCount = 0;
    
    if (q) {
      paramCount++;
      whereConditions.push(`LOWER(nombre) LIKE LOWER($${paramCount})`);
      params.push(`%${q}%`);
    }
    
    if (activo !== null) {
      paramCount++;
      whereConditions.push(`activo = $${paramCount}`);
      params.push(activo === 'true');
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    params.push(limit, offset);
    
    const query = `
      SELECT s.*, 
             COUNT(sc.cita_id) as total_citas_realizadas
      FROM servicios s
      LEFT JOIN servicio_citas sc ON sc.servicio_id = s.id
      LEFT JOIN citas c ON c.id = sc.cita_id AND c.estado = 'completada'
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.nombre
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const result = await db.query(query, params);
    
    // Contar total
    const countQuery = `SELECT COUNT(*) FROM servicios ${whereClause}`;
    const countResult = await db.query(countQuery, params.slice(0, paramCount));
    
    res.json({
      services: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /services/:id - Obtener servicio específico
router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT s.*, 
             COUNT(sc.cita_id) as total_citas,
             AVG(CASE WHEN c.estado = 'completada' THEN s.precio END) as precio_promedio_completadas
      FROM servicios s
      LEFT JOIN servicio_citas sc ON sc.servicio_id = s.id
      LEFT JOIN citas c ON c.id = sc.cita_id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /services - Crear servicio
router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const { nombre, descripcion, duracion_min, precio, activo = true, categoria } = req.body;
  
  if (!nombre || !duracion_min || precio === undefined) {
    return res.status(400).json({ 
      error: 'nombre, duracion_min y precio son requeridos' 
    });
  }
  
  if (duracion_min <= 0) {
    return res.status(400).json({ error: 'La duración debe ser mayor a 0' });
  }
  
  if (precio < 0) {
    return res.status(400).json({ error: 'El precio no puede ser negativo' });
  }
  
  try {
    const result = await db.query(
      `INSERT INTO servicios (nombre, descripcion, duracion_min, precio, activo, categoria) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [nombre, descripcion, duracion_min, precio, activo, categoria]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      res.status(400).json({ error: 'Ya existe un servicio con ese nombre' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// PUT /services/:id - Actualizar servicio
router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { nombre, descripcion, duracion_min, precio, activo, categoria } = req.body;
  
  if (duracion_min !== undefined && duracion_min <= 0) {
    return res.status(400).json({ error: 'La duración debe ser mayor a 0' });
  }
  
  if (precio !== undefined && precio < 0) {
    return res.status(400).json({ error: 'El precio no puede ser negativo' });
  }
  
  try {
    const result = await db.query(
      `UPDATE servicios 
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           duracion_min = COALESCE($3, duracion_min),
           precio = COALESCE($4, precio),
           activo = COALESCE($5, activo),
           categoria = COALESCE($6, categoria)
       WHERE id = $7
       RETURNING *`,
      [nombre, descripcion, duracion_min, precio, activo, categoria, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      res.status(400).json({ error: 'Ya existe un servicio con ese nombre' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// DELETE /services/:id - Eliminar servicio
router.delete('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  try {
    // Verificar si tiene citas asociadas
    const citasResult = await db.query(
      `SELECT COUNT(*) FROM servicio_citas sc
       JOIN citas c ON c.id = sc.cita_id
       WHERE sc.servicio_id = $1 AND c.estado IN ('pendiente', 'confirmada')`,
      [id]
    );
    
    if (parseInt(citasResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el servicio porque tiene citas pendientes o confirmadas' 
      });
    }
    
    const result = await db.query(
      'DELETE FROM servicios WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /services/categories - Obtener categorías de servicios
router.get('/categories/list', async (req, res) => {
  const db = req.app.get('db');
  
  try {
    const result = await db.query(`
      SELECT categoria, COUNT(*) as total_servicios
      FROM servicios 
      WHERE categoria IS NOT NULL AND categoria != ''
      GROUP BY categoria
      ORDER BY categoria
    `);
    
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
