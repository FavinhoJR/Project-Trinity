import { Router } from 'express';
const router = Router();

// GET /customers - Listar clientes con búsqueda
router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const { q = '', page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    const { rows } = await db.query(
      `SELECT id, nombre, telefono, email, 
              (SELECT COUNT(*) FROM citas WHERE cliente_id = clientes.id) as total_citas
       FROM clientes 
       WHERE LOWER(nombre) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1)
       ORDER BY id DESC 
       LIMIT $2 OFFSET $3`,
      [`%${q}%`, limit, offset]
    );
    
    const countResult = await db.query(
      'SELECT COUNT(*) FROM clientes WHERE LOWER(nombre) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1)',
      [`%${q}%`]
    );
    
    res.json({
      customers: rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /customers/:id - Obtener cliente específico
router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  try {
    const { rows } = await db.query(
      `SELECT c.*, 
              COUNT(citas.id) as total_citas,
              MAX(citas.fecha_inicio) as ultima_cita
       FROM clientes c
       LEFT JOIN citas ON citas.cliente_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /customers - Crear cliente
router.post('/', async (req, res) => {
  const db = req.app.get('db');
  const { nombre, telefono, email } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  
  try {
    const { rows } = await db.query(
      'INSERT INTO clientes (nombre, telefono, email) VALUES ($1,$2,$3) RETURNING id, nombre, telefono, email',
      [nombre, telefono, email]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') { // Unique violation
      res.status(400).json({ error: 'El email ya está registrado' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// PUT /customers/:id - Actualizar cliente
router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { nombre, telefono, email } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  
  try {
    const { rows } = await db.query(
      'UPDATE clientes SET nombre=$1, telefono=$2, email=$3 WHERE id=$4 RETURNING id, nombre, telefono, email',
      [nombre, telefono, email, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      res.status(400).json({ error: 'El email ya está registrado' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// DELETE /customers/:id - Eliminar cliente
router.delete('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  
  try {
    // Verificar si tiene citas pendientes
    const citasResult = await db.query(
      'SELECT COUNT(*) FROM citas WHERE cliente_id = $1 AND estado IN (\'pendiente\', \'confirmada\')',
      [id]
    );
    
    if (parseInt(citasResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el cliente porque tiene citas pendientes o confirmadas' 
      });
    }
    
    const { rows } = await db.query(
      'DELETE FROM clientes WHERE id=$1 RETURNING id',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
