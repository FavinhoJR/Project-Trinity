# TRINITY

Sistema web de gestión para salón de belleza desarrollado con React, Vite, Node.js, Express y PostgreSQL.

## Descripción

TRINITY centraliza la operación diaria de un salón de belleza en una sola plataforma. El sistema permite gestionar:

- clientes
- servicios
- citas
- usuarios y roles
- reportes operativos

El proyecto está pensado para uso académico y demostrativo. No está orientado a una operación agresiva de producción, pero sí a mostrar una arquitectura consistente, una interfaz cuidada y una base técnica mantenible.

## Stack

### Frontend

- React 18
- Vite
- React Router
- Lucide React
- CSS personalizado

### Backend

- Node.js
- Express
- PostgreSQL
- JWT
- bcryptjs

## Módulos disponibles

### Implementados

- autenticación con JWT
- control de acceso por roles
- gestión de clientes
- gestión de servicios
- gestión de citas
- gestión de usuarios
- dashboard
- reportes con exportación CSV

### Preparados para crecimiento

- inventario
- ventas y POS
- base para notificaciones

Estos tres módulos ya tienen estructura inicial en base de datos, pero todavía no cuentan con flujo funcional completo en la aplicación.

## Roles del sistema

### Administrador

- acceso completo
- administración de usuarios
- acceso a reportes
- configuración general de servicios

### Recepción

- gestión de clientes
- creación y edición de citas
- gestión de servicios
- acceso a reportes operativos

### Estilista

- acceso a sus citas
- actualización de estado y notas de atención

## Estructura del proyecto

```text
Project-Trinity/
├── backend/
│   ├── __tests__/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   ├── init-db.js
│   ├── seed-data.js
│   └── package.json
├── db/
│   └── init.sql
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── docker-compose.yml
├── Manual_Usuario_Trinity.html
└── render.yaml
```

## Cómo ejecutar localmente

### 1. Instalar dependencias

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### 2. Crear el archivo de entorno del backend

Crea `backend/.env` con este contenido:

```env
PORT=4000
DATABASE_URL=postgresql://postgres@localhost:5432/trinity
JWT_SECRET=supersecret_dev_key_change_me
NODE_ENV=development
```

### 3. Levantar PostgreSQL con Docker

Desde la raíz del proyecto:

```powershell
docker compose up -d db
```

### 4. Inicializar base de datos y datos de ejemplo

```powershell
cd backend
npm run init-db
npm run seed
```

### 5. Ejecutar backend

```powershell
cd backend
npm run dev
```

### 6. Ejecutar frontend

En otra terminal:

```powershell
cd frontend
npm run dev
```

### 7. Abrir la aplicación

- frontend: `http://localhost:5173`
- backend: `http://localhost:4000`
- health check: `http://localhost:4000/health`

## Usuarios de prueba

- `admin@trinity.local` / `trinity123`
- `recepcion@trinity.local` / `trinity123`
- `stylist@trinity.local` / `trinity123`

## Scripts útiles

### Backend

```powershell
npm run dev
npm run start
npm run init-db
npm run seed
npm test
```

### Frontend

```powershell
npm run dev
npm run build
npm run preview
```

## Estado actual del proyecto

Se realizaron mejoras recientes en:

- alineación entre frontend y backend
- validaciones de usuarios, citas y clientes
- limpieza visual del sistema
- dashboard y reportes con datos reales
- corrección de pruebas backend
- documentación y estructura del repositorio

## Pendientes reales

- implementar módulo operativo completo de inventario
- implementar ventas y POS con flujo visual completo
- construir notificaciones funcionales sobre la base actual
- ampliar pruebas end-to-end con base de datos de prueba dedicada

## Despliegue

El repositorio incluye:

- `render.yaml` para despliegue en Render
- `docker-compose.yml` para desarrollo local con PostgreSQL

## Licencia

Proyecto académico y demostrativo.
