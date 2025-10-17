# TRINITY - Sistema de Gestión de Salón de Belleza

## 📋 Descripción del Proyecto

**TRINITY** es un sistema completo de gestión para salones de belleza desarrollado con tecnologías modernas. El sistema permite gestionar clientes, servicios, citas, usuarios y generar reportes detallados para optimizar la operación del negocio.

## 🚀 Características Principales

### ✅ Funcionalidades Implementadas

- **🔐 Sistema de Autenticación**
  - Login seguro con JWT
  - Roles de usuario (Admin, Recepción, Estilista)
  - Control de acceso basado en roles (RBAC)

- **👥 Gestión de Clientes**
  - CRUD completo de clientes
  - Información detallada (contacto, dirección, notas)
  - Historial de citas y gastos
  - Búsqueda y filtrado avanzado

- **✂️ Gestión de Servicios**
  - Catálogo de servicios con precios
  - Categorización por tipo de servicio
  - Control de disponibilidad (activo/inactivo)
  - Estadísticas de servicios más populares

- **📅 Gestión de Citas**
  - Programación de citas con estilistas
  - Estados de cita (pendiente, confirmada, completada, cancelada)
  - Asignación de múltiples servicios por cita
  - Vista de calendario y agenda

- **👤 Gestión de Usuarios**
  - Administración de usuarios del sistema
  - Asignación de roles y permisos
  - Cambio de contraseñas
  - Control de estado (activo/inactivo)

- **📊 Sistema de Reportes**
  - Dashboard con estadísticas en tiempo real
  - Reportes de ingresos por período
  - Análisis de clientes más frecuentes
  - Exportación de datos a CSV
  - Servicios más populares

- **💰 Moneda Guatemalteca**
  - Formateo en Quetzales (GTQ)
  - Configuración regional para Guatemala
  - Cálculos precisos de precios

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación y autorización
- **bcryptjs** - Encriptación de contraseñas
- **CORS** - Configuración de acceso cruzado

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Herramienta de construcción
- **React Router** - Enrutamiento
- **Lucide React** - Iconografía
- **CSS3** - Estilos personalizados

### Despliegue
- **Render** - Plataforma de hosting
- **PostgreSQL en Render** - Base de datos en la nube
- **GitHub** - Control de versiones

## 🏗️ Arquitectura del Sistema

### Estructura del Proyecto
```
trinity_starter/
├── backend/
│   ├── src/
│   │   ├── routes/          # Rutas de la API
│   │   ├── middleware/      # Middleware de autenticación
│   │   └── server.js        # Servidor principal
│   ├── db/
│   │   └── init.sql         # Esquema de base de datos
│   ├── init-db.js           # Script de inicialización
│   ├── seed-data.js         # Datos de ejemplo
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── contexts/        # Contextos de React
│   │   ├── services/        # Servicios de API
│   │   └── utils/           # Utilidades
│   └── package.json
└── README.md
```

### Base de Datos
- **users** - Usuarios del sistema
- **clientes** - Información de clientes
- **servicios** - Catálogo de servicios
- **citas** - Programación de citas
- **servicio_citas** - Relación servicios-citas

## 🔧 Configuración y Despliegue

### Variables de Entorno

#### Backend (.env)
```env
DATABASE_URL=postgresql://usuario:password@host:port/database
JWT_SECRET=clave_secreta_jwt
PORT=4000
NODE_ENV=production
```

#### Frontend (.env.production)
```env
VITE_API_URL=https://tu-backend.onrender.com
```

### Despliegue en Render

1. **Backend (Web Service)**
   - Conectar repositorio GitHub
   - Configurar variables de entorno
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Frontend (Static Site)**
   - Conectar repositorio GitHub
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Configurar variable `VITE_API_URL`

3. **Base de Datos PostgreSQL**
   - Crear instancia en Render
   - Configurar SSL
   - Ejecutar scripts de inicialización

## 👥 Roles y Permisos

### Administrador
- Acceso completo al sistema
- Gestión de usuarios
- Configuración de servicios
- Acceso a todos los reportes

### Recepción
- Gestión de clientes
- Programación de citas
- Gestión de servicios
- Reportes básicos

### Estilista
- Vista de sus citas asignadas
- Actualización de estado de citas
- Dashboard personalizado

## 🎨 Diseño y UX

### Características de la Interfaz
- **Diseño Responsivo** - Adaptable a móviles y tablets
- **Tema Moderno** - Interfaz limpia y profesional
- **Navegación Intuitiva** - Menú lateral con iconografía clara
- **Feedback Visual** - Alertas, loading states y confirmaciones
- **Accesibilidad** - Cumple estándares de accesibilidad web

### Paleta de Colores
- **Primario**: Azul (#3b82f6)
- **Secundario**: Gris (#64748b)
- **Éxito**: Verde (#10b981)
- **Advertencia**: Amarillo (#f59e0b)
- **Error**: Rojo (#ef4444)

## 📱 Funcionalidades por Módulo

### Dashboard
- Estadísticas generales del salón
- Citas recientes
- Servicios más populares
- Estilistas destacados
- Métricas de ingresos

### Clientes
- Lista paginada de clientes
- Búsqueda por nombre, teléfono o email
- Formulario de creación/edición
- Historial de citas por cliente
- Total gastado por cliente

### Servicios
- Catálogo en formato de tarjetas
- Filtros por categoría y estado
- Precios en Quetzales
- Duración estimada
- Estadísticas de uso

### Citas
- Vista de calendario
- Filtros por estilista y estado
- Asignación de múltiples servicios
- Notas y observaciones
- Estados de seguimiento

### Usuarios
- Gestión completa de usuarios
- Asignación de roles
- Cambio de contraseñas
- Control de estado
- Protección contra auto-eliminación

### Reportes
- Dashboard con métricas clave
- Filtros por período
- Exportación a CSV
- Análisis de tendencias
- Reportes de ingresos

## 🔒 Seguridad

### Medidas Implementadas
- **Autenticación JWT** - Tokens seguros con expiración
- **Encriptación de Contraseñas** - bcrypt con salt
- **Control de Acceso** - RBAC por roles
- **Validación de Entrada** - Sanitización de datos
- **CORS Configurado** - Control de dominios permitidos
- **SSL/TLS** - Conexiones encriptadas en producción

## 🚀 Rendimiento

### Optimizaciones
- **Lazy Loading** - Carga bajo demanda de componentes
- **Paginación** - Manejo eficiente de grandes datasets
- **Caché de Datos** - Reducción de llamadas a API
- **Compresión** - Assets optimizados
- **CDN** - Entrega rápida de recursos estáticos

## 📊 Métricas y Analytics

### Datos Recopilados
- Total de clientes registrados
- Citas programadas vs completadas
- Ingresos por período
- Servicios más demandados
- Rendimiento por estilista
- Tendencias temporales

## 🔄 Mantenimiento

### Tareas Regulares
- **Backup de Base de Datos** - Respaldo automático en Render
- **Actualización de Dependencias** - Seguridad y nuevas características
- **Monitoreo de Rendimiento** - Métricas de uso y errores
- **Limpieza de Datos** - Archivo de registros antiguos

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

1. **Error de Conexión a Base de Datos**
   - Verificar variables de entorno
   - Confirmar configuración SSL
   - Revisar logs de Render

2. **Problemas de Autenticación**
   - Verificar JWT_SECRET
   - Confirmar expiración de tokens
   - Revisar configuración CORS

3. **Errores de Build**
   - Verificar versiones de Node.js
   - Limpiar caché de npm
   - Revisar dependencias

## 📈 Roadmap Futuro

### Mejoras Planificadas
- **Notificaciones Push** - Recordatorios de citas
- **Integración de Pagos** - Procesamiento de pagos en línea
- **App Móvil** - Aplicación nativa para estilistas
- **IA y Analytics** - Predicciones y recomendaciones
- **Integración con Redes Sociales** - Marketing automatizado

## 👨‍💻 Desarrollo

### Comandos Útiles

```bash
# Backend
npm run dev          # Desarrollo con hot reload
npm run start        # Producción
npm run init-db      # Inicializar base de datos
npm run seed         # Agregar datos de ejemplo

# Frontend
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
```

### Estructura de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato de código
refactor: refactorización
test: pruebas
chore: tareas de mantenimiento
```

## 📞 Contacto y Soporte

Para soporte técnico o consultas sobre el proyecto:
- **Email**: soporte@trinity-salon.com
- **Documentación**: [Wiki del Proyecto]
- **Issues**: [GitHub Issues]

---

## 🎉 Conclusión

TRINITY es un sistema completo y moderno para la gestión de salones de belleza, diseñado con las mejores prácticas de desarrollo web. Su arquitectura escalable, interfaz intuitiva y funcionalidades robustas lo convierten en la solución ideal para optimizar la operación de cualquier salón de belleza.

**¡Gracias por elegir TRINITY para tu salón de belleza!** ✨