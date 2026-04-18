import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import appointmentsRouter from '../src/routes/appointments.js';

const app = express();
app.use(express.json());

const mockPool = {
  query: jest.fn()
};
app.set('db', mockPool);
app.use('/appointments', (req, res, next) => {
  req.user = { sub: 1, email: 'admin@trinity.local', role: 'admin' };
  next();
}, appointmentsRouter);

describe('📅 Appointments Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /appointments', () => {
    test('✅ Debe listar citas con filtros', async () => {
      const mockAppointments = [
        {
          id: 1,
          fecha_inicio: '2024-01-15T10:00:00Z',
          cliente_nombre: 'Juan Pérez',
          estilista_email: 'stylist@trinity.local',
          estado: 'confirmada',
          servicios: ['Corte básico'],
          precio_total: 75.00
        }
      ];

      const mockCount = [{ count: '1' }];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockAppointments })
        .mockResolvedValueOnce({ rows: mockCount });

      const response = await request(app)
        .get('/appointments')
        .query({ estado: 'confirmada' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('appointments');
      expect(response.body).toHaveProperty('total', 1);
      expect(response.body.appointments).toHaveLength(1);
    });

    test('✅ Debe filtrar por estilista', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const response = await request(app)
        .get('/appointments')
        .query({ estilista_id: 2 });

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('c.estilista_id = $1'),
        expect.arrayContaining([2])
      );
    });
  });

  describe('POST /appointments', () => {
    test('✅ Debe crear cita correctamente', async () => {
      const mockServiciosDuracion = [{ duracion_total: 60 }];
      const mockCitaCreada = [{ id: 1 }];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '1', duracion_total: 60 }] })
        .mockResolvedValueOnce({ rows: mockCitaCreada })
        .mockResolvedValueOnce({ rows: [] }); // Servicios asociados

      const appointmentData = {
        cliente_id: 1,
        estilista_id: 2,
        servicio_ids: [1],
        fecha_inicio: '2024-01-15T10:00:00Z',
        estado: 'pendiente'
      };

      const response = await request(app)
        .post('/appointments')
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('message', 'Cita creada exitosamente');
    });

    test('❌ Debe fallar con datos requeridos faltantes', async () => {
      const response = await request(app)
        .post('/appointments')
        .send({
          cliente_id: 1
          // estilista_id y fecha_inicio faltantes
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 
        'cliente_id, estilista_id y fecha_inicio son requeridos');
    });

    test('❌ Debe fallar sin servicios', async () => {
      const response = await request(app)
        .post('/appointments')
        .send({
          cliente_id: 1,
          estilista_id: 2,
          fecha_inicio: '2024-01-15T10:00:00Z',
          servicio_ids: [] // Sin servicios
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 
        'Debe seleccionar al menos un servicio');
    });

    test('❌ Debe manejar conflicto de horarios', async () => {
      const conflictError = new Error('Conflicto de horario: estilista 2 ya tiene cita en ese rango');
      
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '1', duracion_total: 60 }] })
        .mockRejectedValueOnce(conflictError);

      const response = await request(app)
        .post('/appointments')
        .send({
          cliente_id: 1,
          estilista_id: 2,
          servicio_ids: [1],
          fecha_inicio: '2024-01-15T10:00:00Z'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 
        'Conflicto de horario: el estilista ya tiene una cita en ese horario');
    });
  });

  describe('GET /appointments/calendar/:year/:month', () => {
    test('✅ Debe obtener citas del calendario', async () => {
      const mockCalendarData = [
        {
          id: 1,
          fecha_inicio: '2024-01-15T10:00:00Z',
          cliente_nombre: 'Juan Pérez',
          estilista_email: 'stylist@trinity.local',
          servicios: ['Corte básico']
        }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockCalendarData });

      const response = await request(app)
        .get('/appointments/calendar/2024/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('cliente_nombre', 'Juan Pérez');
    });

    test('✅ Debe filtrar por estilista en calendario', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/appointments/calendar/2024/1')
        .query({ estilista_id: 2 });

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND c.estilista_id = $3'),
        expect.arrayContaining(['2024', '1', '2'])
      );
    });
  });
});
