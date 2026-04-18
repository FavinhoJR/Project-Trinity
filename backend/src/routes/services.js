import { Router } from 'express';

const router = Router();

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBooleanParam(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (String(value).toLowerCase() === 'true') {
    return true;
  }

  if (String(value).toLowerCase() === 'false') {
    return false;
  }

  return null;
}

router.get('/categories/list', async (req, res) => {
  const db = req.app.get('db');

  try {
    const result = await db.query(
      `SELECT categoria, COUNT(*) AS total_servicios
       FROM servicios
       WHERE categoria IS NOT NULL AND categoria <> ''
       GROUP BY categoria
       ORDER BY categoria`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const q = req.query.q?.trim() || '';
  const activo = parseBooleanParam(req.query.activo);
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(LOWER(s.nombre) LIKE LOWER($${params.length})
        OR COALESCE(LOWER(s.descripcion), '') LIKE LOWER($${params.length})
        OR COALESCE(LOWER(s.categoria), '') LIKE LOWER($${params.length}))`
    );
  }

  if (activo !== null) {
    params.push(activo);
    conditions.push(`s.activo = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    params.push(limit, offset);

    const result = await db.query(
      `SELECT
         s.*,
         COUNT(c.id) FILTER (WHERE c.estado = 'completada') AS total_citas_realizadas,
         COUNT(c.id) FILTER (WHERE c.estado IN ('pendiente', 'confirmada')) AS citas_pendientes
       FROM servicios s
       LEFT JOIN servicio_citas sc ON sc.servicio_id = s.id
       LEFT JOIN citas c ON c.id = sc.cita_id
       ${whereClause}
       GROUP BY s.id
       ORDER BY s.activo DESC, s.nombre
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM servicios s ${whereClause}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      services: result.rows,
      total: Number.parseInt(countResult.rows[0].count, 10),
      page,
      limit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de servicio inv\u00e1lido' });
  }

  try {
    const result = await db.query(
      `SELECT
         s.*,
         COUNT(c.id) AS total_citas,
         COUNT(c.id) FILTER (WHERE c.estado = 'completada') AS total_citas_completadas,
         COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN s.precio ELSE 0 END), 0) AS ingresos_generados
       FROM servicios s
       LEFT JOIN servicio_citas sc ON sc.servicio_id = s.id
       LEFT JOIN citas c ON c.id = sc.cita_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const { nombre, descripcion, duracion_min, precio, activo = true, categoria } = req.body;

  if (!nombre?.trim() || duracion_min === undefined || precio === undefined) {
    return res.status(400).json({ error: 'nombre, duracion_min y precio son requeridos' });
  }

  if (Number(duracion_min) <= 0) {
    return res.status(400).json({ error: 'La duraci\u00f3n debe ser mayor a 0' });
  }

  if (Number(precio) < 0) {
    return res.status(400).json({ error: 'El precio no puede ser negativo' });
  }

  try {
    const result = await db.query(
      `INSERT INTO servicios (nombre, descripcion, duracion_min, precio, activo, categoria)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nombre.trim(), descripcion || null, duracion_min, precio, activo, categoria || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un servicio con ese nombre' });
    }

    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);
  const { nombre, descripcion, duracion_min, precio, activo, categoria } = req.body;

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de servicio inv\u00e1lido' });
  }

  if (duracion_min !== undefined && Number(duracion_min) <= 0) {
    return res.status(400).json({ error: 'La duraci\u00f3n debe ser mayor a 0' });
  }

  if (precio !== undefined && Number(precio) < 0) {
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
      [nombre?.trim() || null, descripcion ?? null, duracion_min, precio, activo, categoria ?? null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un servicio con ese nombre' });
    }

    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de servicio inv\u00e1lido' });
  }

  try {
    const citasResult = await db.query(
      `SELECT COUNT(*)
       FROM servicio_citas sc
       JOIN citas c ON c.id = sc.cita_id
       WHERE sc.servicio_id = $1
         AND c.estado IN ('pendiente', 'confirmada')`,
      [id]
    );

    if (Number.parseInt(citasResult.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el servicio porque tiene citas pendientes o confirmadas'
      });
    }

    const result = await db.query(
      'DELETE FROM servicios WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
