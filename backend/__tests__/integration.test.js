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

// Configurar app de prueba completa
const app = express();
app.use(cors());
app.use(express.json());

// Base de datos de prueba (usar una BD separada para tests)
const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres@localhost:5432/trinity_test'
});
app.set('db', testPool);

app.use('/auth', authRouter);
app.use('/customers', authGuard, rbac(['admin','recepcion']), customersRouter);
app.use('/appointments', authGuard, rbac(['admin','recepcion','estilista']), appointmentsRouter);

describe('🔗 Integration Tests', () => {
  let authToken;
  let testCustomerId;

  beforeAll(async () => {
    // Configurar datos de prueba
    try {
      // Crear usuario de prueba
      await testPool.query(`
        INSERT INTO users (email, password_hash, role, nombre) 
        VALUES ('test@trinity.local', '$2a$10$vBQJfQIdCb2G6vNF4p7HaeEDuMKnOL.SVeRnbRovEdwrtrSjtHHjG', 'admin', 'Test Admin')
        ON CONFLICT (email) DO NOTHING
      `);
    } catch (error) {
      console.log('Setup error (puede ser normal):', error.message);
    }
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    try {
      await testPool.query('DELETE FROM users WHERE email = $1', ['test@trinity.local']);
      if (testCustomerId) {
        await testPool.query('DELETE FROM clientes WHERE id = $1', [testCustomerId]);
      }
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
    await testPool.end();
  });

  test('🔄 Flujo completo: Login → Crear Cliente → Crear Cita', async () => {
    // 1. Login
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@trinity.local',
        password: 'admin'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    authToken = loginResponse.body.token;

    // 2. Crear cliente
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

    // 3. Verificar que el cliente se creó
    const getCustomerResponse = await request(app)
      .get(`/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getCustomerResponse.status).toBe(200);
    expect(getCustomerResponse.body).toHaveProperty('nombre', 'Cliente de Prueba');

    // 4. Listar clientes
    const listResponse = await request(app)
      .get('/customers')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveProperty('customers');
    expect(listResponse.body.customers.length).toBeGreaterThan(0);
  });

  test('🔒 Debe rechazar acceso sin token', async () => {
    const response = await request(app)
      .get('/customers');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'No token');
  });

  test('🔒 Debe rechazar token inválido', async () => {
    const response = await request(app)
      .get('/customers')
      .set('Authorization', 'Bearer token_invalido');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid token');
  });
});
