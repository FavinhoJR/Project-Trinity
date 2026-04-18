import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import customersRouter from '../src/routes/customers.js';

const app = express();
app.use(express.json());

const mockPool = {
  query: jest.fn()
};
app.set('db', mockPool);
app.use('/customers', (req, res, next) => {
  req.user = { sub: 1, email: 'admin@trinity.local', role: 'admin' };
  next();
}, customersRouter);

describe('👥 Customers Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /customers', () => {
    test('✅ Debe listar clientes con paginación', async () => {
      const mockCustomers = [
        { id: 1, nombre: 'Juan Pérez', telefono: '555-001', email: 'juan@email.com', total_citas: 5 },
        { id: 2, nombre: 'María García', telefono: '555-002', email: 'maria@email.com', total_citas: 3 }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockCustomers })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });

      const response = await request(app)
        .get('/customers')
        .query({ page: 1, limit: 50 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body.customers).toHaveLength(2);
    });

    test('✅ Debe buscar clientes por nombre', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Juan Pérez' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const response = await request(app)
        .get('/customers')
        .query({ q: 'Juan' });

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(c.nombre) LIKE LOWER($1)'),
        expect.arrayContaining(['%Juan%'])
      );
    });
  });

  describe('POST /customers', () => {
    test('✅ Debe crear cliente correctamente', async () => {
      const newCustomer = {
        id: 1,
        nombre: 'Cliente Nuevo',
        telefono: '555-999',
        email: 'nuevo@email.com'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [newCustomer] });

      const response = await request(app)
        .post('/customers')
        .send({
          nombre: 'Cliente Nuevo',
          telefono: '555-999',
          email: 'nuevo@email.com'
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(newCustomer);
    });

    test('❌ Debe fallar sin nombre requerido', async () => {
      const response = await request(app)
        .post('/customers')
        .send({
          telefono: '555-999',
          email: 'nuevo@email.com'
          // nombre faltante
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El nombre es requerido');
    });

    test('❌ Debe manejar email duplicado', async () => {
      const duplicateError = new Error('Duplicate key');
      duplicateError.code = '23505';
      mockPool.query.mockRejectedValueOnce(duplicateError);

      const response = await request(app)
        .post('/customers')
        .send({
          nombre: 'Cliente Duplicado',
          email: 'existente@email.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El email ya está registrado');
    });
  });

  describe('PUT /customers/:id', () => {
    test('✅ Debe actualizar cliente existente', async () => {
      const updatedCustomer = {
        id: 1,
        nombre: 'Cliente Actualizado',
        telefono: '555-updated',
        email: 'updated@email.com'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [updatedCustomer] });

      const response = await request(app)
        .put('/customers/1')
        .send({
          nombre: 'Cliente Actualizado',
          telefono: '555-updated',
          email: 'updated@email.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updatedCustomer);
    });

    test('❌ Debe fallar con cliente inexistente', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/customers/999')
        .send({
          nombre: 'Cliente Inexistente'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Cliente no encontrado');
    });
  });

  describe('DELETE /customers/:id', () => {
    test('✅ Debe eliminar cliente sin citas pendientes', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Sin citas pendientes
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Eliminación exitosa

      const response = await request(app)
        .delete('/customers/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Cliente eliminado correctamente');
    });

    test('❌ Debe fallar si tiene citas pendientes', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Tiene citas

      const response = await request(app)
        .delete('/customers/1');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 
        'No se puede eliminar el cliente porque tiene citas pendientes o confirmadas');
    });
  });
});
