import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

async function testPassword() {
  console.log('🔍 Verificando contraseña...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a la base de datos');

    // Obtener el usuario admin
    const result = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['admin@trinity.local']);
    
    if (result.rows.length > 0) {
      const storedHash = result.rows[0].password_hash;
      console.log('📋 Hash almacenado:', storedHash);
      
      // Probar contraseña
      const testPassword = 'trinity123';
      const isValid = await bcrypt.compare(testPassword, storedHash);
      
      console.log(`🔐 Probando contraseña "${testPassword}":`, isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
      
      if (!isValid) {
        console.log('🔧 Generando nuevo hash...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('📋 Nuevo hash:', newHash);
        
        // Actualizar en la base de datos
        await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, 'admin@trinity.local']);
        console.log('✅ Hash actualizado en la base de datos');
      }
    } else {
      console.log('❌ Usuario no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testPassword();
