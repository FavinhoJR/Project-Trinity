import { Router } from 'express';
import bcrypt from 'bcryptjs';
const router = Router();

// GET /users - Listar usuarios (solo admin)
router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const { role, activo, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let whereConditions = [];
    let params = [];
    let paramCount = 0;
    
    if (role) {
      paramCount++;
      whereConditions.push(`role = $${paramCount}`);
      params.push(role);
    }
    
    if (activo !== undefined) {
      paramCount++;
      whereConditions.push(`activo = $${paramCount}`);
      params.push(activo === 'true');
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    params.push(limit, offset);
    
    const query = `
      SELECT u.id, u.email, u.role, u.nombre, u.telefono, u.activo, u.created_at,
             COUNT(c.id) as total_citas_asignadas
      FROM users u
      LEFT JOIN citas c ON c.estilista_id = u.id
      ${whereClause}
      GROUP BY u.id, u.email, u.role, u.nombre, u.telefono, u.activo, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const result = await db.query(query, params);
    
    // Contar total
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await db.query(countQuery, params.slice(0, paramCount));
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /users/stylists - Listar solo estilistas activos
router.get('/stylists', async (req, res) => {
  const db = req.app.get('db');
  
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.nombre, u.telefono,
             COUNT(c.id) as citas_pendientes
      FROM users u
      LEFT JOIN citas c ON c.estilista_id = u.id AND c.estado IN ('pendiente', 'confirmada')
      WHERE u.role = 'estilista' AND u.activo = true
      GROUP BY u.id, u.email, u.nombre, u.telefono
      ORDER BY u.nombre
    `);
    
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /users/:id - Obtener usuario específico
router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.role, u.nombre, u.telefono, u.activo, u.created_at,
             COUNT(c.id) as total_citas,
             COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as citas_completadas,
             COUNT(CASE WHEN c.estado IN ('pendiente', 'confirmada') THEN 1 END) as citas_pendientes
      FROM users u
      LEFT JOIN citas c ON c.estilista_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.email, u.role, u.nombre, u.telefono, u.activo, u.created_at
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /users - Crear usuario (solo admin)
router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const { email, password, role, nombre, telefono, activo = true } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ 
      error: 'email, password y role son requeridos' 
    });
  }
  
  if (!['admin', 'recepcion', 'estilista'].includes(role)) {
    return res.status(400).json({ 
      error: 'role debe ser: admin, recepcion o estilista' 
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ 
      error: 'La contraseña debe tener al menos 6 caracteres' 
    });
  }
  
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, nombre, telefono, activo) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, role, nombre, telefono, activo, created_at`,
      [email, passwordHash, role, nombre, telefono, activo]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      res.status(400).json({ error: 'El email ya está registrado' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// PUT /users/:id - Actualizar usuario
router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { email, password, role, nombre, telefono, activo } = req.body;
  
  if (role && !['admin', 'recepcion', 'estilista'].includes(role)) {
    return res.status(400).json({ 
      error: 'role debe ser: admin, recepcion o estilista' 
    });
  }
  
  if (password && password.length < 6) {
    return res.status(400).json({ 
      error: 'La contraseña debe tener al menos 6 caracteres' 
    });
  }
  
  try {
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
      [email, passwordHash, role, nombre, telefono, activo, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      res.status(400).json({ error: 'El email ya está registrado' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// DELETE /users/:id - Eliminar usuario
router.delete('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  try {
    // Verificar si es el último admin
    const adminCount = await db.query(
      'SELECT COUNT(*) FROM users WHERE role = \'admin\' AND activo = true AND id != $1',
      [id]
    );
    
    const userToDelete = await db.query('SELECT role FROM users WHERE id = $1', [id]);
    
    if (userToDelete.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (userToDelete.rows[0].role === 'admin' && parseInt(adminCount.rows[0].count) === 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el último administrador del sistema' 
      });
    }
    
    // Verificar si tiene citas pendientes como estilista
    const citasResult = await db.query(
      'SELECT COUNT(*) FROM citas WHERE estilista_id = $1 AND estado IN (\'pendiente\', \'confirmada\')',
      [id]
    );
    
    if (parseInt(citasResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el usuario porque tiene citas pendientes o confirmadas como estilista' 
      });
    }
    
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /users/:id/toggle-status - Activar/Desactivar usuario
router.put('/:id/toggle-status', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  try {
    const result = await db.query(
      `UPDATE users 
       SET activo = NOT activo 
       WHERE id = $1 
       RETURNING id, email, role, nombre, activo`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const action = result.rows[0].activo ? 'activado' : 'desactivado';
    res.json({ 
      message: `Usuario ${action} correctamente`, 
      user: result.rows[0] 
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
