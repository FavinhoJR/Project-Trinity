import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

async function fixAllPasswords() {
  console.log('🔧 Corrigiendo todas las contraseñas...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a la base de datos');

    const users = [
      { email: 'admin@trinity.local', password: 'trinity123' },
      { email: 'stylist@trinity.local', password: 'trinity123' },
      { email: 'recepcion@trinity.local', password: 'trinity123' }
    ];

    for (const user of users) {
      console.log(`🔧 Procesando: ${user.email}`);
      
      // Generar nuevo hash
      const newHash = await bcrypt.hash(user.password, 10);
      
      // Actualizar en la base de datos
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, user.email]);
      
      // Verificar que funciona
      const result = await pool.query('SELECT password_hash FROM users WHERE email = $1', [user.email]);
      const storedHash = result.rows[0].password_hash;
      const isValid = await bcrypt.compare(user.password, storedHash);
      
      console.log(`   ✅ ${user.email}: ${isValid ? 'VÁLIDA' : 'INVÁLIDA'}`);
    }

    console.log('');
    console.log('🎉 ¡Todas las contraseñas corregidas!');
    console.log('');
    console.log('📋 Credenciales de prueba:');
    console.log('   - admin@trinity.local / trinity123');
    console.log('   - stylist@trinity.local / trinity123');
    console.log('   - recepcion@trinity.local / trinity123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixAllPasswords();
