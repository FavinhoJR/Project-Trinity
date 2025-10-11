-- TODO: Add your DB schema/triggers he-- Esquema mínimo para arrancar TRINITY (usuarios, clientes, servicios, citas)
-- y evitar doble reserva por estilista.

-- 1) USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','recepcion','estilista')),
  nombre TEXT,
  telefono TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) SERVICIOS
CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  duracion_min INT NOT NULL CHECK (duracion_min > 0),
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  categoria TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) CITAS
CREATE TABLE IF NOT EXISTS citas (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  estilista_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  duracion_min INT NOT NULL CHECK (duracion_min > 0),
  estado TEXT NOT NULL CHECK (estado IN ('pendiente','confirmada','cancelada','completada')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) SERVICIO_CITAS (detalle 1..N servicios por cita)
CREATE TABLE IF NOT EXISTS servicio_citas (
  id SERIAL PRIMARY KEY,
  cita_id INT NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  servicio_id INT NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT
);

-- 6) Trigger anti-solapamiento por estilista
CREATE OR REPLACE FUNCTION check_overlap_cita() RETURNS TRIGGER AS $$
DECLARE
  new_from TIMESTAMPTZ := NEW.fecha_inicio;
  new_to   TIMESTAMPTZ := NEW.fecha_inicio + (NEW.duracion_min || ' minutes')::interval;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM citas c
    WHERE c.estilista_id = NEW.estilista_id
      AND tstzrange(c.fecha_inicio, c.fecha_inicio + (c.duracion_min || ' minutes')::interval, '[)')
          && tstzrange(new_from, new_to, '[)')
      AND (TG_OP = 'INSERT' OR c.id <> NEW.id)
  ) THEN
    RAISE EXCEPTION 'Conflicto de horario: estilista % ya tiene cita en ese rango', NEW.estilista_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_overlap_cita_ins ON citas;
CREATE TRIGGER trg_check_overlap_cita_ins
BEFORE INSERT ON citas
FOR EACH ROW EXECUTE FUNCTION check_overlap_cita();

DROP TRIGGER IF EXISTS trg_check_overlap_cita_upd ON citas;
CREATE TRIGGER trg_check_overlap_cita_upd
BEFORE UPDATE OF fecha_inicio, duracion_min, estilista_id ON citas
FOR EACH ROW EXECUTE FUNCTION check_overlap_cita();

-- 7) Datos básicos
-- admin (usa tu hash bcrypt provisto)
INSERT INTO users (email, password_hash, role, nombre)
VALUES ('admin@trinity.local', '$2a$10$uIWvEl.ksn3L6EikRIFN1.x54iF8zcEtbPRhkownZxKGJD4LE4h9y', 'admin', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- un estilista para probar agenda
INSERT INTO users (email, password_hash, role, nombre)
VALUES ('stylist@trinity.local', '$2a$10$uIWvEl.ksn3L6EikRIFN1.x54iF8zcEtbPRhkownZxKGJD4LE4h9y', 'estilista', 'María Estilista')
ON CONFLICT (email) DO NOTHING;

-- recepcionista de ejemplo
INSERT INTO users (email, password_hash, role, nombre)
VALUES ('recepcion@trinity.local', '$2a$10$uIWvEl.ksn3L6EikRIFN1.x54iF8zcEtbPRhkownZxKGJD4LE4h9y', 'recepcion', 'Ana Recepción')
ON CONFLICT (email) DO NOTHING;

-- clientes de ejemplo
INSERT INTO clientes (nombre, telefono, email) VALUES 
('Cliente Demo', '555-000', 'cliente@demo.local'),
('María García', '555-001', 'maria.garcia@email.com'),
('Carlos López', '555-002', 'carlos.lopez@email.com')
ON CONFLICT (email) DO NOTHING;

-- servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, duracion_min, precio, categoria) VALUES 
('Corte básico', 'Corte de cabello estándar', 45, 75.00, 'Cortes'),
('Corte y peinado', 'Corte de cabello con peinado incluido', 60, 95.00, 'Cortes'),
('Tinte completo', 'Aplicación de tinte en todo el cabello', 120, 150.00, 'Coloración'),
('Mechas', 'Aplicación de mechas', 90, 120.00, 'Coloración'),
('Manicure', 'Cuidado completo de uñas', 30, 45.00, 'Uñas'),
('Pedicure', 'Cuidado completo de pies', 45, 55.00, 'Uñas')
ON CONFLICT (nombre) DO NOTHING;