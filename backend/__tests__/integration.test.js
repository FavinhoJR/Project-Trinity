import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { Pool } from 'pg';
import express from 'express';
import cors from 'cors';
import authRouter from '../src/routes/auth.js';
import customersRouter from '../src/routes/customers.js';
import appointmentsRouter from '../src/routes/appointments.js';
import { authGuard } from '../src/middleware/auth.js';
import { rbac } from '../src/middleware/rbac.js';

const describeIfDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

const app = express();
app.use(cors());
app.use(express.json());

const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres@localhost:5432/trinity_test'
});

app.set('db', testPool);
app.use('/auth', authRouter);
app.use('/customers', authGuard, rbac(['admin', 'recepcion']), customersRouter);
app.use('/appointments', authGuard, rbac(['admin', 'recepcion', 'estilista']), appointmentsRouter);

describeIfDb('Integration Tests', () => {
  let authToken;
  let testCustomerId;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'integration-secret';

    await testPool.query(`
      INSERT INTO users (email, password_hash, role, nombre)
      VALUES ('test@trinity.local', '$2a$10$uIWvEl.ksn3L6EikRIFN1.x54iF8zcEtbPRhkownZxKGJD4LE4h9y', 'admin', 'Test Admin')
      ON CONFLICT (email) DO NOTHING
    `);
  });

  afterAll(async () => {
    try {
      if (testCustomerId) {
        await testPool.query('DELETE FROM clientes WHERE id = $1', [testCustomerId]);
      }

      await testPool.query('DELETE FROM users WHERE email = $1', ['test@trinity.local']);
    } finally {
      await testPool.end();
    }
  });

  test('flujo completo: login y CRUD basico de clientes', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@trinity.local',
        password: 'trinity123'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    authToken = loginResponse.body.token;

    const customerResponse = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nombre: 'Cliente de Prueba',
        telefono: '555-TEST',
        email: 'test.customer@email.com'
      });

    expect(customerResponse.status).toBe(201);
    expect(customerResponse.body).toHaveProperty('id');
    testCustomerId = customerResponse.body.id;

    const getCustomerResponse = await request(app)
      .get(`/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getCustomerResponse.status).toBe(200);
    expect(getCustomerResponse.body).toHaveProperty('nombre', 'Cliente de Prueba');
  });

  test('debe rechazar acceso sin token', async () => {
    const response = await request(app).get('/customers');
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'No token');
  });
});
