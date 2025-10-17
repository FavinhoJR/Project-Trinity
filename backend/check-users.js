import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function checkUsers() {
  console.log('🔍 Verificando usuarios en la base de datos...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a la base de datos');

    // Verificar todos los usuarios
    const result = await pool.query('SELECT id, email, role, nombre, activo FROM users ORDER BY id');
    console.log(`📋 Usuarios encontrados: ${result.rows.length}`);
    
    result.rows.forEach(user => {
      console.log(`   - ID: ${user.id} | Email: ${user.email} | Rol: ${user.role} | Nombre: ${user.nombre} | Activo: ${user.activo}`);
    });
    
    // Verificar usuario específico
    console.log('\n🔍 Verificando usuario admin@trinity.local...');
    const admin = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@trinity.local']);
    
    if (admin.rows.length > 0) {
      const user = admin.rows[0];
      console.log('✅ Usuario admin@trinity.local encontrado:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Rol: ${user.role}`);
      console.log(`   - Nombre: ${user.nombre}`);
      console.log(`   - Activo: ${user.activo}`);
      console.log(`   - Password hash: ${user.password_hash.substring(0, 20)}...`);
      console.log(`   - Creado: ${user.created_at}`);
    } else {
      console.log('❌ Usuario admin@trinity.local NO encontrado');
    }

    // Verificar si hay algún problema con la tabla
    console.log('\n🔍 Verificando estructura de la tabla...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura de la tabla users:');
    tableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkUsers();
