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

function createPool() {
  const poolConfig = {
    connectionString: process.env.DATABASE_URL
  };

  if (process.env.NODE_ENV === 'production') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  return new Pool(poolConfig);
}

export function createApp(pool = createPool()) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.set('db', pool);

  app.get('/', (req, res) => {
    res.json({
      message: 'TRINITY API - Sistema de Gestion de Salon',
      version: '1.1.0',
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

  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.use('/auth', authRouter);
  app.use('/customers', authGuard, rbac(['admin', 'recepcion']), customersRouter);
  app.use('/appointments', authGuard, rbac(['admin', 'recepcion', 'estilista']), appointmentsRouter);
  app.use('/services', authGuard, rbac(['admin', 'recepcion']), servicesRouter);
  app.use('/users', authGuard, rbac(['admin']), usersRouter);
  app.use('/reports', authGuard, rbac(['admin', 'recepcion']), reportsRouter);

  return app;
}

const shouldListen = process.env.NODE_ENV !== 'test';

if (shouldListen) {
  const app = createApp();
  const port = process.env.PORT || 4000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  app.listen(port, host, () => {
    console.log(`API running on http://${host}:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}
