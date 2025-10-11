# TRINITY — Sistema Completo de Gestión de Salón

## 🚀 Características

### ✅ Sistema Completo
- **Dashboard** con estadísticas en tiempo real
- **Gestión de Citas** con prevención de conflictos
- **Gestión de Clientes** con historial completo
- **Gestión de Servicios** con categorías y precios
- **Gestión de Usuarios** con roles y permisos
- **Reportes y Analytics** detallados
- **Autenticación JWT** con control de acceso basado en roles

### 🔐 Roles del Sistema
- **Admin**: Acceso completo al sistema
- **Recepción**: Gestión de clientes, citas y servicios
- **Estilista**: Ver y gestionar sus propias citas

### 🛠 Stack Tecnológico
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + Vite + CSS moderno
- **Base de Datos**: PostgreSQL con triggers para validaciones
- **Infraestructura**: Docker + Docker Compose

## 📋 Requisitos
- Docker Desktop / Docker Engine
- Node 18+

## 🚀 Instalación y Arranque

### 1) Iniciar la Base de Datos
```bash
docker compose up -d
```
> **PostgreSQL**: localhost:5432 / trinity:trinity / DB: trinity  
> **Adminer**: http://localhost:8080 (System: PostgreSQL, Server: db, User: trinity, Password: trinity, Database: trinity)

La base de datos se inicializa automáticamente con:
- Esquema completo con triggers de validación
- Usuarios de prueba
- Clientes y servicios de ejemplo

### 2) Backend API
```bash
cd backend
npm i
npm run dev
```
> **API**: http://localhost:4000
> **Health Check**: http://localhost:4000/health

### 3) Frontend Web
```bash
cd ../frontend
npm i
npm run dev
```
> **Aplicación Web**: http://localhost:5173

## 👥 Usuarios de Prueba

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| Admin | admin@trinity.local | admin | Acceso completo |
| Recepción | recepcion@trinity.local | admin | Clientes, citas, servicios |
| Estilista | stylist@trinity.local | admin | Sus propias citas |

## 🔧 API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión

### Clientes
- `GET /customers` - Listar clientes (con paginación y búsqueda)
- `GET /customers/:id` - Obtener cliente específico
- `POST /customers` - Crear cliente
- `PUT /customers/:id` - Actualizar cliente
- `DELETE /customers/:id` - Eliminar cliente

### Citas
- `GET /appointments` - Listar citas (con filtros avanzados)
- `GET /appointments/:id` - Obtener cita específica
- `POST /appointments` - Crear cita
- `PUT /appointments/:id` - Actualizar cita
- `DELETE /appointments/:id` - Cancelar/Eliminar cita
- `GET /appointments/calendar/:year/:month` - Vista calendario

### Servicios
- `GET /services` - Listar servicios
- `GET /services/:id` - Obtener servicio específico
- `POST /services` - Crear servicio
- `PUT /services/:id` - Actualizar servicio
- `DELETE /services/:id` - Eliminar servicio
- `GET /services/categories/list` - Listar categorías

### Usuarios
- `GET /users` - Listar usuarios (solo admin)
- `GET /users/stylists` - Listar estilistas activos
- `POST /users` - Crear usuario
- `PUT /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

### Reportes
- `GET /reports/dashboard` - Estadísticas del dashboard
- `GET /reports/revenue` - Reporte de ingresos
- `GET /reports/appointments` - Reporte de citas
- `GET /reports/clients` - Reporte de clientes

## 🗄 Base de Datos

### Características Avanzadas
- **Triggers automáticos** para prevenir solapamiento de citas
- **Validaciones a nivel de BD** para integridad de datos
- **Índices optimizados** para consultas rápidas
- **Datos persistentes** con volúmenes Docker

### Tablas Principales
- `users` - Usuarios del sistema con roles
- `clientes` - Información de clientes
- `servicios` - Catálogo de servicios con precios
- `citas` - Reservas con validación de conflictos
- `servicio_citas` - Relación servicios-citas (N:M)

## 🎨 Frontend Moderno

### Características de UI
- **Diseño responsive** para móviles y desktop
- **Sidebar navegable** con roles dinámicos
- **Componentes reutilizables** (Modal, Alert, StatusBadge)
- **Sistema de autenticación** con JWT
- **Gestión de estado** con Context API
- **Formularios avanzados** con validación

### Páginas Implementadas
- **Login** - Autenticación con usuarios de prueba
- **Dashboard** - Estadísticas y resumen ejecutivo
- **Citas** - Gestión completa con filtros y modal
- **Clientes** - CRUD completo (placeholder)
- **Servicios** - Gestión de catálogo (placeholder)
- **Usuarios** - Administración de empleados (placeholder)
- **Reportes** - Analytics y estadísticas (placeholder)

## 🔒 Seguridad

- **JWT Tokens** con expiración de 8 horas
- **Contraseñas hasheadas** con bcrypt
- **Control de acceso** basado en roles (RBAC)
- **Validación de entrada** en frontend y backend
- **Protección CORS** configurada

## 📊 Funcionalidades Avanzadas

### Gestión Inteligente de Horarios
- Prevención automática de solapamiento de citas
- Validación en tiempo real de disponibilidad
- Cálculo automático de duración basado en servicios

### Sistema de Reportes
- Dashboard con métricas clave
- Reportes de ingresos por período
- Análisis de rendimiento por estilista
- Estadísticas de clientes frecuentes

### Experiencia de Usuario
- Interfaz intuitiva y moderna
- Navegación contextual por roles
- Feedback visual inmediato
- Responsive design para todos los dispositivos

## 🚀 Próximas Funcionalidades

Las siguientes características están planificadas para futuras versiones:

- [ ] **Vista de Calendario Visual** - Interfaz tipo calendario para gestión de citas
- [ ] **Sistema de Notificaciones** - Recordatorios automáticos por email/SMS
- [ ] **Módulo de Inventario** - Gestión de productos y stock
- [ ] **Sistema de Pagos** - Integración con pasarelas de pago
- [ ] **App Móvil** - Aplicación nativa para clientes
- [ ] **Integración WhatsApp** - Confirmaciones y recordatorios
- [ ] **Backup Automático** - Respaldos programados de la BD
- [ ] **Multi-sucursal** - Gestión de múltiples ubicaciones

## 🛠 Desarrollo

### Estructura del Proyecto
```
trinity_starter/
├── backend/          # API Node.js + Express
├── frontend/         # React + Vite
├── db/              # Scripts SQL de inicialización
├── docker-compose.yml
└── README.md
```

### Comandos de Desarrollo
```bash
# Reiniciar base de datos
docker compose down -v && docker compose up -d

# Logs del backend
cd backend && npm run dev

# Logs del frontend
cd frontend && npm run dev

# Ver logs de la base de datos
docker compose logs db
```

## 📝 Licencia

Este proyecto está desarrollado como un sistema de gestión completo para salones de belleza.

---

**TRINITY** - Sistema Profesional de Gestión de Salón de Belleza 💄✂️
