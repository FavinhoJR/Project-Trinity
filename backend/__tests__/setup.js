import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Configuración de base de datos de prueba
export const setupTestDatabase = async () => {
  const testPool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres@localhost:5432/trinity_test'
  });

  try {
    // Crear base de datos de prueba si no existe
    await testPool.query('CREATE DATABASE trinity_test');
  } catch (error) {
    // La BD ya existe, continuar
  }

  // Ejecutar script de inicialización
  const initSql = fs.readFileSync(path.join(process.cwd(), '../db/init.sql'), 'utf8');
  await testPool.query(initSql);

  return testPool;
};

export const cleanupTestDatabase = async (pool) => {
  try {
    // Limpiar datos de prueba
    await pool.query('TRUNCATE TABLE servicio_citas, citas, clientes, servicios, users RESTART IDENTITY CASCADE');
  } catch (error) {
    console.log('Cleanup error:', error.message);
  } finally {
    await pool.end();
  }
};
