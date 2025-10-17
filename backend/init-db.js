import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  console.log('🔄 Iniciando conexión a la base de datos...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Probar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a la base de datos');

    // Leer el archivo init.sql
    const sqlFilePath = join(__dirname, '..', 'db', 'init.sql');
    const sqlScript = readFileSync(sqlFilePath, 'utf8');
    
    console.log('🔄 Ejecutando script de inicialización...');
    
    // Ejecutar el script
    await pool.query(sqlScript);
    
    console.log('✅ Base de datos inicializada correctamente');
    console.log('');
    console.log('📋 Usuarios creados:');
    console.log('   - admin@trinity.local / trinity123');
    console.log('   - stylist@trinity.local / trinity123');
    console.log('   - recepcion@trinity.local / trinity123');
    console.log('');
    console.log('🎉 ¡Listo! Tu base de datos está configurada.');
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();

