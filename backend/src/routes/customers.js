import { Router } from 'express';

const router = Router();

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const q = req.query.q?.trim() || '';
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
  const offset = (page - 1) * limit;
  const searchTerm = `%${q}%`;

  try {
    const { rows } = await db.query(
      `SELECT
         c.id,
         c.nombre,
         c.telefono,
         c.email,
         c.fecha_nacimiento,
         c.direccion,
         c.notas,
         c.created_at,
         COUNT(DISTINCT ct.id) AS total_citas,
         COALESCE(SUM(CASE WHEN ct.estado = 'completada' THEN s.precio ELSE 0 END), 0) AS total_gastado,
         MAX(ct.fecha_inicio) AS ultima_visita
       FROM clientes c
       LEFT JOIN citas ct ON ct.cliente_id = c.id
       LEFT JOIN servicio_citas sc ON sc.cita_id = ct.id
       LEFT JOIN servicios s ON s.id = sc.servicio_id
       WHERE (
         $1 = '%%'
         OR LOWER(c.nombre) LIKE LOWER($1)
         OR COALESCE(LOWER(c.email), '') LIKE LOWER($1)
         OR COALESCE(LOWER(c.telefono), '') LIKE LOWER($1)
       )
       GROUP BY c.id
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT $2 OFFSET $3`,
      [searchTerm, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*)
       FROM clientes
       WHERE (
         $1 = '%%'
         OR LOWER(nombre) LIKE LOWER($1)
         OR COALESCE(LOWER(email), '') LIKE LOWER($1)
         OR COALESCE(LOWER(telefono), '') LIKE LOWER($1)
       )`,
      [searchTerm]
    );

    res.json({
      customers: rows,
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
    return res.status(400).json({ error: 'ID de cliente inv\u00e1lido' });
  }

  try {
    const { rows } = await db.query(
      `SELECT
         c.*,
         COUNT(DISTINCT ct.id) AS total_citas,
         COALESCE(SUM(CASE WHEN ct.estado = 'completada' THEN s.precio ELSE 0 END), 0) AS total_gastado,
         MAX(ct.fecha_inicio) AS ultima_cita
       FROM clientes c
       LEFT JOIN citas ct ON ct.cliente_id = c.id
       LEFT JOIN servicio_citas sc ON sc.cita_id = ct.id
       LEFT JOIN servicios s ON s.id = sc.servicio_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const {
    nombre,
    telefono = null,
    email = null,
    fecha_nacimiento = null,
    direccion = null,
    notas = null
  } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO clientes (nombre, telefono, email, fecha_nacimiento, direccion, notas)
       VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6)
       RETURNING id, nombre, telefono, email, fecha_nacimiento, direccion, notas, created_at`,
      [nombre.trim(), telefono, email, fecha_nacimiento, direccion, notas]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ya est\u00e1 registrado' });
    }

    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);
  const {
    nombre,
    telefono = null,
    email = null,
    fecha_nacimiento = null,
    direccion = null,
    notas = null
  } = req.body;

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de cliente inv\u00e1lido' });
  }

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE clientes
       SET nombre = $1,
           telefono = $2,
           email = NULLIF($3, ''),
           fecha_nacimiento = $4,
           direccion = $5,
           notas = $6
       WHERE id = $7
       RETURNING id, nombre, telefono, email, fecha_nacimiento, direccion, notas, created_at`,
      [nombre.trim(), telefono, email, fecha_nacimiento, direccion, notas, id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ya est\u00e1 registrado' });
    }

    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de cliente inv\u00e1lido' });
  }

  try {
    const citasResult = await db.query(
      `SELECT COUNT(*)
       FROM citas
       WHERE cliente_id = $1
         AND estado IN ('pendiente', 'confirmada')`,
      [id]
    );

    if (Number.parseInt(citasResult.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el cliente porque tiene citas pendientes o confirmadas'
      });
    }

    const { rows } = await db.query(
      'DELETE FROM clientes WHERE id = $1 RETURNING id',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
