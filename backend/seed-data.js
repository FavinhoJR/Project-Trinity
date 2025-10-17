import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function seedData() {
  console.log('🌱 Agregando datos de ejemplo...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a la base de datos');

    // Datos de ejemplo adicionales
    const seedSQL = `
    -- Más clientes de ejemplo
    INSERT INTO clientes (nombre, telefono, email) VALUES 
    ('Ana Martínez', '555-1234', 'ana.martinez@email.com'),
    ('Pedro Ramírez', '555-5678', 'pedro.ramirez@email.com'),
    ('Sofía Torres', '555-9012', 'sofia.torres@email.com'),
    ('Luis González', '555-3456', 'luis.gonzalez@email.com'),
    ('Carmen Silva', '555-7890', 'carmen.silva@email.com'),
    ('Roberto Díaz', '555-2468', 'roberto.diaz@email.com'),
    ('Laura Hernández', '555-1357', 'laura.hernandez@email.com'),
    ('Diego Morales', '555-8642', 'diego.morales@email.com')
    ON CONFLICT (email) DO NOTHING;

    -- Obtener IDs necesarios para las citas
    DO $$
    DECLARE
      estilista_id INT;
      cliente1_id INT;
      cliente2_id INT;
      cliente3_id INT;
      cliente4_id INT;
      servicio1_id INT;
      servicio2_id INT;
      servicio3_id INT;
    BEGIN
      -- Obtener ID del estilista
      SELECT id INTO estilista_id FROM users WHERE email = 'stylist@trinity.local' LIMIT 1;
      
      -- Obtener IDs de clientes
      SELECT id INTO cliente1_id FROM clientes WHERE email = 'ana.martinez@email.com' LIMIT 1;
      SELECT id INTO cliente2_id FROM clientes WHERE email = 'sofia.torres@email.com' LIMIT 1;
      SELECT id INTO cliente3_id FROM clientes WHERE email = 'carmen.silva@email.com' LIMIT 1;
      SELECT id INTO cliente4_id FROM clientes WHERE email = 'laura.hernandez@email.com' LIMIT 1;
      
      -- Obtener IDs de servicios
      SELECT id INTO servicio1_id FROM servicios WHERE nombre = 'Corte básico' LIMIT 1;
      SELECT id INTO servicio2_id FROM servicios WHERE nombre = 'Tinte completo' LIMIT 1;
      SELECT id INTO servicio3_id FROM servicios WHERE nombre = 'Mechas' LIMIT 1;

      -- Citas de ejemplo (algunas en el pasado, algunas futuras)
      
      -- Cita completada (hace 3 días)
      IF cliente1_id IS NOT NULL AND estilista_id IS NOT NULL THEN
        INSERT INTO citas (cliente_id, estilista_id, fecha_inicio, duracion_min, estado, notas)
        VALUES (
          cliente1_id,
          estilista_id,
          NOW() - INTERVAL '3 days' + INTERVAL '10 hours',
          45,
          'completada',
          'Cliente satisfecha con el resultado'
        )
        ON CONFLICT DO NOTHING;
        
        -- Agregar servicio a la cita
        INSERT INTO servicio_citas (cita_id, servicio_id)
        SELECT c.id, servicio1_id
        FROM citas c
        WHERE c.cliente_id = cliente1_id 
        AND c.fecha_inicio = NOW() - INTERVAL '3 days' + INTERVAL '10 hours'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      END IF;

      -- Cita confirmada (mañana)
      IF cliente2_id IS NOT NULL AND estilista_id IS NOT NULL THEN
        INSERT INTO citas (cliente_id, estilista_id, fecha_inicio, duracion_min, estado, notas)
        VALUES (
          cliente2_id,
          estilista_id,
          NOW() + INTERVAL '1 day' + INTERVAL '14 hours',
          120,
          'confirmada',
          'Tinte completo - Color castaño'
        )
        ON CONFLICT DO NOTHING;
        
        INSERT INTO servicio_citas (cita_id, servicio_id)
        SELECT c.id, servicio2_id
        FROM citas c
        WHERE c.cliente_id = cliente2_id 
        AND c.fecha_inicio = NOW() + INTERVAL '1 day' + INTERVAL '14 hours'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      END IF;

      -- Cita pendiente (en 2 días)
      IF cliente3_id IS NOT NULL AND estilista_id IS NOT NULL THEN
        INSERT INTO citas (cliente_id, estilista_id, fecha_inicio, duracion_min, estado, notas)
        VALUES (
          cliente3_id,
          estilista_id,
          NOW() + INTERVAL '2 days' + INTERVAL '16 hours',
          90,
          'pendiente',
          'Primera vez - Mechas californianas'
        )
        ON CONFLICT DO NOTHING;
        
        INSERT INTO servicio_citas (cita_id, servicio_id)
        SELECT c.id, servicio3_id
        FROM citas c
        WHERE c.cliente_id = cliente3_id 
        AND c.fecha_inicio = NOW() + INTERVAL '2 days' + INTERVAL '16 hours'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      END IF;

      -- Cita de hoy
      IF cliente4_id IS NOT NULL AND estilista_id IS NOT NULL THEN
        INSERT INTO citas (cliente_id, estilista_id, fecha_inicio, duracion_min, estado, notas)
        VALUES (
          cliente4_id,
          estilista_id,
          NOW() + INTERVAL '2 hours',
          60,
          'confirmada',
          'Corte y peinado para evento especial'
        )
        ON CONFLICT DO NOTHING;
        
        INSERT INTO servicio_citas (cita_id, servicio_id)
        SELECT c.id, servicio1_id
        FROM citas c
        WHERE c.cliente_id = cliente4_id 
        AND c.fecha_inicio >= NOW()
        AND c.fecha_inicio <= NOW() + INTERVAL '3 hours'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      END IF;

      RAISE NOTICE 'Datos de ejemplo agregados exitosamente';
    END $$;
    `;

    await pool.query(seedSQL);
    
    console.log('✅ Datos de ejemplo agregados correctamente');
    console.log('');
    console.log('📊 Resumen:');
    console.log('   - 8 clientes adicionales');
    console.log('   - 4 citas de ejemplo (pasadas, hoy, futuras)');
    console.log('   - Estados: completada, confirmada, pendiente');
    console.log('');
    console.log('🎉 ¡Listo! Tu aplicación tiene datos de ejemplo.');
    
  } catch (error) {
    console.error('❌ Error al agregar datos de ejemplo:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedData();

