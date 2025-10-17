import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import authRouter from './routes/auth.js';
import customersRouter from './routes/customers.js';
import appointmentsRouter from './routes/appointments.js';
import servicesRouter from './routes/services.js';
import usersRouter from './routes/users.js';
import reportsRouter from './routes/reports.js';
import { authGuard } from './middleware/auth.js';
import { rbac } from './middleware/rbac.js';

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la base de datos con SSL para producción
const poolConfig = {
  connectionString: process.env.DATABASE_URL
};

// Agregar SSL si estamos en producción (Render requiere SSL)
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);
app.set('db', pool);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'TRINITY API - Sistema de Gestión de Salón',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/login',
      customers: '/customers',
      appointments: '/appointments',
      services: '/services',
      users: '/users',
      reports: '/reports'
    }
  });
});

// Health
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Routes
app.use('/auth', authRouter);
app.use('/customers', authGuard, rbac(['admin','recepcion']), customersRouter);
app.use('/appointments', authGuard, rbac(['admin','recepcion','estilista']), appointmentsRouter);
app.use('/services', authGuard, rbac(['admin','recepcion']), servicesRouter);
app.use('/users', authGuard, rbac(['admin']), usersRouter);
app.use('/reports', authGuard, rbac(['admin','recepcion']), reportsRouter);

const port = process.env.PORT || 4000;
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(port, host, () => {
  console.log(`API running on http://${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
