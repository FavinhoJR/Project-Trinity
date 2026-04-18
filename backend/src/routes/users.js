import { Router } from 'express';
import bcrypt from 'bcryptjs';

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

  return String(value).toLowerCase() === 'true';
}

function isValidRole(role) {
  return ['admin', 'recepcion', 'estilista'].includes(role);
}

async function ensureAdminSafety(db, { targetUserId, nextRole, nextActivo }) {
  const targetUser = await db.query('SELECT id, role, activo FROM users WHERE id = $1', [targetUserId]);

  if (!targetUser.rows.length) {
    return { ok: false, status: 404, error: 'Usuario no encontrado' };
  }

  const currentUser = targetUser.rows[0];
  const becomesNonAdmin = currentUser.role === 'admin' && nextRole && nextRole !== 'admin';
  const becomesInactive = currentUser.role === 'admin' && nextActivo === false && currentUser.activo !== false;

  if (becomesNonAdmin || becomesInactive) {
    const adminCount = await db.query(
      `SELECT COUNT(*)
       FROM users
       WHERE role = 'admin'
         AND activo = true
         AND id <> $1`,
      [targetUserId]
    );

    if (Number.parseInt(adminCount.rows[0].count, 10) === 0) {
      return { ok: false, status: 400, error: 'No se puede dejar al sistema sin un administrador activo' };
    }
  }

  return { ok: true, user: currentUser };
}

router.get('/stylists', async (req, res) => {
  const db = req.app.get('db');

  try {
    const result = await db.query(
      `SELECT
         u.id,
         u.email,
         u.nombre,
         u.telefono,
         COUNT(c.id) FILTER (WHERE c.estado IN ('pendiente', 'confirmada')) AS citas_pendientes
       FROM users u
       LEFT JOIN citas c ON c.estilista_id = u.id
       WHERE u.role = 'estilista' AND u.activo = true
       GROUP BY u.id, u.email, u.nombre, u.telefono
       ORDER BY COALESCE(u.nombre, u.email)`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const q = req.query.q?.trim() || '';
  const role = req.query.role?.trim();
  const activo = parseBooleanParam(req.query.activo);
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(COALESCE(LOWER(u.nombre), '') LIKE LOWER($${params.length})
        OR LOWER(u.email) LIKE LOWER($${params.length})
        OR COALESCE(LOWER(u.telefono), '') LIKE LOWER($${params.length}))`
    );
  }

  if (role) {
    params.push(role);
    conditions.push(`u.role = $${params.length}`);
  }

  if (activo !== null) {
    params.push(activo);
    conditions.push(`u.activo = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    params.push(limit, offset);

    const result = await db.query(
      `SELECT
         u.id,
         u.email,
         u.role,
         u.nombre,
         u.telefono,
         u.activo,
         u.created_at,
         COUNT(c.id) AS total_citas_asignadas,
         COUNT(c.id) FILTER (WHERE c.estado = 'completada') AS citas_completadas
       FROM users u
       LEFT JOIN citas c ON c.estilista_id = u.id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      users: result.rows,
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
    return res.status(400).json({ error: 'ID de usuario inv\u00e1lido' });
  }

  try {
    const result = await db.query(
      `SELECT
         u.id,
         u.email,
         u.role,
         u.nombre,
         u.telefono,
         u.activo,
         u.created_at,
         COUNT(c.id) AS total_citas,
         COUNT(c.id) FILTER (WHERE c.estado = 'completada') AS citas_completadas,
         COUNT(c.id) FILTER (WHERE c.estado IN ('pendiente', 'confirmada')) AS citas_pendientes
       FROM users u
       LEFT JOIN citas c ON c.estilista_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const { email, password, role, nombre = null, telefono = null, activo = true } = req.body;

  if (!email?.trim() || !password || !role) {
    return res.status(400).json({ error: 'email, password y role son requeridos' });
  }

  if (!isValidRole(role)) {
    return res.status(400).json({ error: 'role debe ser: admin, recepcion o estilista' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contrase\u00f1a debe tener al menos 6 caracteres' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, nombre, telefono, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, nombre, telefono, activo, created_at`,
      [email.trim().toLowerCase(), passwordHash, role, nombre, telefono, activo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ya est\u00e1 registrado' });
    }

    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/password', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);
  const password = req.body?.password;

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de usuario inv\u00e1lido' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contrase\u00f1a debe tener al menos 6 caracteres' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2
       RETURNING id, email, role, nombre, telefono, activo, created_at`,
      [passwordHash, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Contrase\u00f1a actualizada correctamente', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);
  const { email, password, role, nombre, telefono, activo } = req.body;

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de usuario inv\u00e1lido' });
  }

  if (role && !isValidRole(role)) {
    return res.status(400).json({ error: 'role debe ser: admin, recepcion o estilista' });
  }

  if (password && password.length < 6) {
    return res.status(400).json({ error: 'La contrase\u00f1a debe tener al menos 6 caracteres' });
  }

  try {
    const adminSafety = await ensureAdminSafety(db, {
      targetUserId: id,
      nextRole: role,
      nextActivo: activo
    });

    if (!adminSafety.ok) {
      return res.status(adminSafety.status).json({ error: adminSafety.error });
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const result = await db.query(
      `UPDATE users
       SET email = COALESCE($1, email),
           password_hash = COALESCE($2, password_hash),
           role = COALESCE($3, role),
           nombre = COALESCE($4, nombre),
           telefono = COALESCE($5, telefono),
           activo = COALESCE($6, activo)
       WHERE id = $7
       RETURNING id, email, role, nombre, telefono, activo, created_at`,
      [email?.trim()?.toLowerCase() || null, passwordHash, role, nombre, telefono, activo, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ya est\u00e1 registrado' });
    }

    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/toggle-status', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de usuario inv\u00e1lido' });
  }

  if (Number(req.user?.sub) === id) {
    return res.status(400).json({ error: 'No puedes desactivar tu propio usuario' });
  }

  try {
    const currentUser = await db.query('SELECT id, activo FROM users WHERE id = $1', [id]);
    if (!currentUser.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nextActivo = !currentUser.rows[0].activo;
    const adminSafety = await ensureAdminSafety(db, {
      targetUserId: id,
      nextActivo
    });

    if (!adminSafety.ok) {
      return res.status(adminSafety.status).json({ error: adminSafety.error });
    }

    const result = await db.query(
      `UPDATE users
       SET activo = $1
       WHERE id = $2
       RETURNING id, email, role, nombre, activo`,
      [nextActivo, id]
    );

    res.json({
      message: `Usuario ${nextActivo ? 'activado' : 'desactivado'} correctamente`,
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const db = req.app.get('db');
  const id = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID de usuario inv\u00e1lido' });
  }

  if (Number(req.user?.sub) === id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }

  try {
    const adminSafety = await ensureAdminSafety(db, {
      targetUserId: id,
      nextActivo: false
    });

    if (!adminSafety.ok) {
      return res.status(adminSafety.status).json({ error: adminSafety.error });
    }

    const citasResult = await db.query(
      `SELECT COUNT(*)
       FROM citas
       WHERE estilista_id = $1
         AND estado IN ('pendiente', 'confirmada')`,
      [id]
    );

    if (Number.parseInt(citasResult.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el usuario porque tiene citas pendientes o confirmadas como estilista'
      });
    }

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
