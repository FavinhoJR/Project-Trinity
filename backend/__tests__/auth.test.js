const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');

// Configurar app de prueba
const app = express();
app.use(cors());
app.use(express.json());

// Mock database pool para pruebas
const mockPool = {
  query: jest.fn()
};
app.set('db', mockPool);
app.use('/auth', authRouter);

describe('🔐 Auth Routes', () => {
  beforeAll(() => {
    // Reset mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    test('✅ Debe hacer login exitoso con credenciales correctas', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@trinity.local',
        password_hash: bcrypt.hashSync('admin', 10),
        role: 'admin'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@trinity.local',
          password: 'admin'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('role', 'admin');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT id, email, password_hash, role FROM users WHERE email=$1 LIMIT 1',
        ['admin@trinity.local']
      );
    });

    test('❌ Debe fallar con email inexistente', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'noexiste@trinity.local',
          password: 'admin'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('❌ Debe fallar con contraseña incorrecta', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@trinity.local',
        password_hash: bcrypt.hashSync('admin', 10),
        role: 'admin'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@trinity.local',
          password: 'contraseña_incorrecta'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('❌ Debe fallar sin email o password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@trinity.local'
          // password faltante
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'email and password required');
    });

    test('❌ Debe manejar errores de base de datos', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@trinity.local',
          password: 'admin'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Database connection failed');
    });
  });
});
