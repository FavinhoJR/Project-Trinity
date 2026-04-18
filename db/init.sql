-- Esquema base de TRINITY para usuarios, clientes, servicios y citas.
-- Incluye una proteccion para evitar dobles reservas por estilista.

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
  fecha_nacimiento DATE,
  direccion TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS notas TEXT;

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

CREATE TABLE IF NOT EXISTS inventario_items (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  sku TEXT UNIQUE,
  categoria TEXT,
  stock_actual INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  unidad TEXT DEFAULT 'unidad',
  costo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_venta NUMERIC(10,2),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES inventario_items(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad INT NOT NULL,
  motivo TEXT,
  referencia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id INT REFERENCES users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'mostrador' CHECK (tipo IN ('mostrador', 'servicios', 'mixta')),
  estado TEXT NOT NULL DEFAULT 'cerrada' CHECK (estado IN ('borrador', 'cerrada', 'anulada')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  metodo_pago TEXT DEFAULT 'efectivo',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venta_detalles (
  id SERIAL PRIMARY KEY,
  venta_id INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  tipo_item TEXT NOT NULL CHECK (tipo_item IN ('servicio', 'producto')),
  servicio_id INT REFERENCES servicios(id) ON DELETE SET NULL,
  inventario_item_id INT REFERENCES inventario_items(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_linea NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('sistema', 'email', 'sms')),
  destinatario TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviada', 'fallida')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
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

-- 7) Datos basicos
-- admin (usa tu hash bcrypt provisto)
INSERT INTO users (email, password_hash, role, nombre)
VALUES ('admin@trinity.local', '$2a$10$uIWvEl.ksn3L6EikRIFN1.x54iF8zcEtbPRhkownZxKGJD4LE4h9y', 'admin', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- un estilista para probar agenda
INSERT INTO users (email, password_hash, role, nombre)
VALUES ('stylist@trinity.local', '$2a$10$uIWvEl.ksn3L6EikRIFN1.x54iF8zcEtbPRhkownZxKGJD4LE4h9y', 'estilista', 'Maria Estilista')
ON CONFLICT (email) DO NOTHING;

-- recepcionista de ejemplo
INSERT INTO users (email, password_hash, role, nombre)
VALUES ('recepcion@trinity.local', '$2a$10$uIWvEl.ksn3L6EikRIFN1.x54iF8zcEtbPRhkownZxKGJD4LE4h9y', 'recepcion', 'Ana Recepcion')
ON CONFLICT (email) DO NOTHING;

-- clientes de ejemplo
INSERT INTO clientes (nombre, telefono, email) VALUES
('Cliente Demo', '555-000', 'cliente@demo.local'),
('Maria Garcia', '555-001', 'maria.garcia@email.com'),
('Carlos Lopez', '555-002', 'carlos.lopez@email.com')
ON CONFLICT (email) DO NOTHING;

-- servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, duracion_min, precio, categoria) VALUES
('Corte basico', 'Corte de cabello estandar', 45, 75.00, 'Cortes'),
('Corte y peinado', 'Corte de cabello con peinado incluido', 60, 95.00, 'Cortes'),
('Tinte completo', 'Aplicacion de tinte en todo el cabello', 120, 150.00, 'Coloracion'),
('Mechas', 'Aplicacion de mechas', 90, 120.00, 'Coloracion'),
('Manicure', 'Cuidado completo de unas', 30, 45.00, 'Unas'),
('Pedicure', 'Cuidado completo de pies', 45, 55.00, 'Unas')
ON CONFLICT (nombre) DO NOTHING;
