import { Router } from 'express';

const router = Router();

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function getExecutor(db) {
  if (typeof db.connect === 'function') {
    const client = await db.connect();
    return { client, release: () => client.release(), transactional: true };
  }

  return { client: db, release: () => {}, transactional: false };
}

async function validateServices(client, serviceIds) {
  const uniqueIds = [...new Set((serviceIds || []).map((id) => Number.parseInt(id, 10)).filter(Number.isFinite))];

  if (!uniqueIds.length) {
    return { valid: false, message: 'Debe seleccionar al menos un servicio' };
  }

  const result = await client.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(duracion_min), 0) AS duracion_total
     FROM servicios
     WHERE id = ANY($1) AND activo = true`,
    [uniqueIds]
  );

  if (Number.parseInt(result.rows[0].total, 10) !== uniqueIds.length) {
    return { valid: false, message: 'Uno o m\u00e1s servicios no existen o est\u00e1n inactivos' };
  }

  return {
    valid: true,
    ids: uniqueIds,
    duracion: Number(result.rows[0].duracion_total) || 60
  };
}

function isManager(role) {
  return role === 'admin' || role === 'recepcion';
}

router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (req.user?.role === 'estilista') {
    params.push(Number(req.user.sub));
    conditions.push(`c.estilista_id = $${params.length}`);
  } else if (req.query.estilista_id) {
    params.push(Number(req.query.estilista_id));
    conditions.push(`c.estilista_id = $${params.length}`);
  }

  if (req.query.dia) {
    params.push(req.query.dia);
    conditions.push(`DATE(c.fecha_inicio) = $${params.length}::date`);
  }

  if (req.query.estado) {
    params.push(req.query.estado);
    conditions.push(`c.estado = $${params.length}`);
  }

  if (req.query.cliente_id) {
    params.push(Number(req.query.cliente_id));
    conditions.push(`c.cliente_id = $${params.length}`);
  }

  if (req.query.fecha_desde) {
    params.push(req.query.fecha_desde);
    conditions.push(`c.fecha_inicio >= $${params.length}::timestamptz`);
  }

  if (req.query.fecha_hasta) {
    params.push(req.query.fecha_hasta);
    conditions.push(`c.fecha_inicio <= $${params.length}::timestamptz`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    params.push(limit, offset);

    const result = await db.query(
      `SELECT
         c.id,
         c.fecha_inicio,
         c.duracion_min,
         c.estado,
         c.notas,
         c.cliente_id,
         c.estilista_id,
         cl.nombre AS cliente_nombre,
         cl.telefono AS cliente_telefono,
         st.email AS estilista_email,
         st.nombre AS estilista_nombre,
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT s.nombre), NULL) AS servicios,
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT s.id), NULL) AS servicio_ids,
         COALESCE(SUM(s.precio), 0) AS precio_total
       FROM citas c
       JOIN clientes cl ON cl.id = c.cliente_id
       JOIN users st ON st.id = c.estilista_id
       LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
       LEFT JOIN servicios s ON s.id = sc.servicio_id
       ${whereClause}
       GROUP BY c.id, cl.nombre, cl.telefono, st.email, st.nombre
       ORDER BY c.fecha_inicio DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await db.query(
      `SELECT COUNT(DISTINCT c.id)
       FROM citas c
       ${whereClause}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      appointments: result.rows,
      total: Number.parseInt(countResult.rows[0].count, 10),
      page,
      limit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/calendar/:year/:month', async (req, res) => {
  const db = req.app.get('db');
  const params = [req.params.year, req.params.month];
  let whereClause = 'WHERE EXTRACT(YEAR FROM c.fecha_inicio) = $1 AND EXTRACT(MONTH FROM c.fecha_inicio) = $2';

  if (req.user?.role === 'estilista') {
    params.push(Number(req.user.sub));
    whereClause += ' AND c.estilista_id = $3';
  } else if (req.query.estilista_id) {
    params.push(req.query.estilista_id);
    whereClause += ' AND c.estilista_id = $3';
  }

  try {
    const result = await db.query(
      `SELECT
         c.id,
         c.fecha_inicio,
         c.duracion_min,
         c.estado,
         c.estilista_id,
         c.notas,
         cl.nombre AS cliente_nombre,
         st.email AS estilista_email,
         st.nombre AS estilista_nombre,
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT s.nombre), NULL) AS servicios
       FROM citas c
       JOIN clientes cl ON cl.id = c.cliente_id
       JOIN users st ON st.id = c.estilista_id
       LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
       LEFT JOIN servicios s ON s.id = sc.servicio_id
       ${whereClause}
       GROUP BY c.id, cl.nombre, st.email, st.nombre
       ORDER BY c.fecha_inicio`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de cita inv\u00e1lido' });
  }

  try {
    const result = await db.query(
      `SELECT
         c.*,
         cl.nombre AS cliente_nombre,
         cl.telefono AS cliente_telefono,
         cl.email AS cliente_email,
         st.email AS estilista_email,
         st.nombre AS estilista_nombre,
         COALESCE(
           json_agg(
             DISTINCT jsonb_build_object(
               'id', s.id,
               'nombre', s.nombre,
               'precio', s.precio,
               'duracion_min', s.duracion_min
             )
           ) FILTER (WHERE s.id IS NOT NULL),
           '[]'::json
         ) AS servicios
       FROM citas c
       JOIN clientes cl ON cl.id = c.cliente_id
       JOIN users st ON st.id = c.estilista_id
       LEFT JOIN servicio_citas sc ON sc.cita_id = c.id
       LEFT JOIN servicios s ON s.id = sc.servicio_id
       WHERE c.id = $1
       GROUP BY c.id, cl.nombre, cl.telefono, cl.email, st.email, st.nombre`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const appointment = result.rows[0];
    if (req.user?.role === 'estilista' && Number(appointment.estilista_id) !== Number(req.user.sub)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  if (!isManager(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const db = req.app.get('db');
  const { cliente_id, estilista_id, servicio_ids = [], fecha_inicio, estado = 'pendiente', notas = null } = req.body;

  if (!cliente_id || !estilista_id || !fecha_inicio) {
    return res.status(400).json({ error: 'cliente_id, estilista_id y fecha_inicio son requeridos' });
  }

  const executor = await getExecutor(db);

  try {
    const { client, transactional } = executor;

    if (transactional) {
      await client.query('BEGIN');
    }

    const serviceValidation = await validateServices(client, servicio_ids);
    if (!serviceValidation.valid) {
      if (transactional) {
        await client.query('ROLLBACK');
      }
      return res.status(400).json({ error: serviceValidation.message });
    }

    const citaResult = await client.query(
      `INSERT INTO citas (cliente_id, estilista_id, fecha_inicio, duracion_min, estado, notas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [cliente_id, estilista_id, fecha_inicio, serviceValidation.duracion, estado, notas]
    );

    const citaId = citaResult.rows[0].id;

    for (const servicioId of serviceValidation.ids) {
      await client.query(
        'INSERT INTO servicio_citas (cita_id, servicio_id) VALUES ($1, $2)',
        [citaId, servicioId]
      );
    }

    if (transactional) {
      await client.query('COMMIT');
    }

    res.status(201).json({ id: citaId, message: 'Cita creada exitosamente' });
  } catch (error) {
    if (executor.transactional) {
      await executor.client.query('ROLLBACK');
    }

    if (error.message.includes('Conflicto de horario')) {
      return res.status(409).json({ error: 'Conflicto de horario: el estilista ya tiene una cita en ese horario' });
    }

    res.status(400).json({ error: error.message });
  } finally {
    executor.release();
  }
});

router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de cita inv\u00e1lido' });
  }

  const executor = await getExecutor(db);

  try {
    const { client, transactional } = executor;

    if (transactional) {
      await client.query('BEGIN');
    }

    const existingCita = await client.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (!existingCita.rows.length) {
      if (transactional) {
        await client.query('ROLLBACK');
      }
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const currentAppointment = existingCita.rows[0];
    const isStylist = req.user?.role === 'estilista';

    if (isStylist && Number(currentAppointment.estilista_id) !== Number(req.user.sub)) {
      if (transactional) {
        await client.query('ROLLBACK');
      }
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (isStylist) {
      const restrictedKeys = ['cliente_id', 'estilista_id', 'fecha_inicio', 'servicio_ids'];
      const triedRestrictedChange = restrictedKeys.some((key) => req.body[key] !== undefined);
      if (triedRestrictedChange) {
        if (transactional) {
          await client.query('ROLLBACK');
        }
        return res.status(403).json({ error: 'El estilista solo puede actualizar estado y notas' });
      }
    }

    let duracionMin = currentAppointment.duracion_min;
    let serviceIds = null;

    if (req.body.servicio_ids !== undefined) {
      const serviceValidation = await validateServices(client, req.body.servicio_ids);
      if (!serviceValidation.valid) {
        if (transactional) {
          await client.query('ROLLBACK');
        }
        return res.status(400).json({ error: serviceValidation.message });
      }

      duracionMin = serviceValidation.duracion;
      serviceIds = serviceValidation.ids;
    }

    const updateResult = await client.query(
      `UPDATE citas
       SET cliente_id = COALESCE($1, cliente_id),
           estilista_id = COALESCE($2, estilista_id),
           fecha_inicio = COALESCE($3, fecha_inicio),
           duracion_min = $4,
           estado = COALESCE($5, estado),
           notas = COALESCE($6, notas)
       WHERE id = $7
       RETURNING *`,
      [
        req.body.cliente_id,
        req.body.estilista_id,
        req.body.fecha_inicio,
        duracionMin,
        req.body.estado,
        req.body.notas,
        id
      ]
    );

    if (serviceIds) {
      await client.query('DELETE FROM servicio_citas WHERE cita_id = $1', [id]);
      for (const servicioId of serviceIds) {
        await client.query(
          'INSERT INTO servicio_citas (cita_id, servicio_id) VALUES ($1, $2)',
          [id, servicioId]
        );
      }
    }

    if (transactional) {
      await client.query('COMMIT');
    }

    res.json({ message: 'Cita actualizada exitosamente', cita: updateResult.rows[0] });
  } catch (error) {
    if (executor.transactional) {
      await executor.client.query('ROLLBACK');
    }

    if (error.message.includes('Conflicto de horario')) {
      return res.status(409).json({ error: 'Conflicto de horario: el estilista ya tiene una cita en ese horario' });
    }

    res.status(500).json({ error: error.message });
  } finally {
    executor.release();
  }
});

router.delete('/:id', async (req, res) => {
  if (!isManager(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);
  const force = req.query.force === 'true';

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de cita inv\u00e1lido' });
  }

  const executor = await getExecutor(db);

  try {
    const { client, transactional } = executor;

    if (transactional) {
      await client.query('BEGIN');
    }

    if (force) {
      await client.query('DELETE FROM servicio_citas WHERE cita_id = $1', [id]);
      const result = await client.query('DELETE FROM citas WHERE id = $1 RETURNING id', [id]);

      if (!result.rows.length) {
        if (transactional) {
          await client.query('ROLLBACK');
        }
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      if (transactional) {
        await client.query('COMMIT');
      }

      return res.json({ message: 'Cita eliminada completamente' });
    }

    const result = await client.query(
      `UPDATE citas
       SET estado = 'cancelada'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (!result.rows.length) {
      if (transactional) {
        await client.query('ROLLBACK');
      }
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (transactional) {
      await client.query('COMMIT');
    }

    res.json({ message: 'Cita cancelada', cita: result.rows[0] });
  } catch (error) {
    if (executor.transactional) {
      await executor.client.query('ROLLBACK');
    }

    res.status(500).json({ error: error.message });
  } finally {
    executor.release();
  }
});

export default router;
