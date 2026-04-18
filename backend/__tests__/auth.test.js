import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import express from 'express';
import cors from 'cors';
import authRouter from '../src/routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

const mockPool = {
  query: jest.fn()
};

app.set('db', mockPool);
app.use('/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('debe hacer login exitoso con credenciales correctas', async () => {
    const mockUser = {
      id: 1,
      email: 'admin@trinity.local',
      password_hash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      nombre: 'Administrador',
      activo: true
    };

    mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@trinity.local', password: 'admin123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('role', 'admin');
    expect(response.body.user).toMatchObject({
      id: 1,
      email: 'admin@trinity.local',
      role: 'admin'
    });
  });

  test('debe fallar con email inexistente', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'noexiste@trinity.local', password: 'admin' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });

  test('debe fallar con usuario inactivo', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 2,
        email: 'inactive@trinity.local',
        password_hash: bcrypt.hashSync('admin', 10),
        role: 'recepcion',
        nombre: 'Inactivo',
        activo: false
      }]
    });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'inactive@trinity.local', password: 'admin' });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', 'El usuario está inactivo');
  });

  test('debe fallar sin email o password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@trinity.local' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'email and password required');
  });
});
