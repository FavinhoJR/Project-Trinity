import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', async (req, res) => {
  const email = req.body?.email?.trim()?.toLowerCase();
  const password = req.body?.password;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  const db = req.app.get('db');

  try {
    const { rows } = await db.query(
      `SELECT id, email, password_hash, role, nombre, activo
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.activo === false) {
      return res.status(403).json({ error: 'El usuario est\u00e1 inactivo' });
    }

    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        nombre: user.nombre || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nombre: user.nombre || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
