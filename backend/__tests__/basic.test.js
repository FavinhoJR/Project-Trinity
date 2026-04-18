import { describe, test, expect } from '@jest/globals';

describe('Pruebas básicas de TRINITY', () => {
  test('debe ejecutar pruebas correctamente', () => {
    expect(true).toBe(true);
  });

  test('debe validar operaciones matemáticas', () => {
    expect(2 + 2).toBe(4);
    expect(10 * 5).toBe(50);
  });

  test('debe validar strings', () => {
    const projectName = 'TRINITY';
    expect(projectName).toBe('TRINITY');
    expect(projectName.length).toBe(7);
  });

  test('debe validar arrays', () => {
    const roles = ['admin', 'recepcion', 'estilista'];
    expect(roles).toHaveLength(3);
    expect(roles).toContain('admin');
    expect(roles[0]).toBe('admin');
  });

  test('debe validar objetos', () => {
    const user = {
      email: 'admin@trinity.local',
      role: 'admin',
      active: true
    };

    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('role', 'admin');
    expect(user.active).toBe(true);
  });

  test('debe validar promesas', async () => {
    await expect(Promise.resolve('success')).resolves.toBe('success');
  });

  test('debe validar funciones', () => {
    const calculateTotal = (price, quantity) => price * quantity;

    expect(calculateTotal(75, 2)).toBe(150);
    expect(calculateTotal(100, 1)).toBe(100);
  });
});
