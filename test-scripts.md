# 🧪 Scripts de Pruebas Automatizadas - TRINITY

## 📋 **Comandos de Pruebas**

### **🔧 Backend Tests (Jest + Supertest)**
```bash
cd backend

# Instalar dependencias de prueba
npm install

# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage

# Ejecutar pruebas específicas
npm test -- --testNamePattern="Auth"
npm test -- __tests__/auth.test.js
```

### **🌐 Frontend Tests (Playwright)**
```bash
cd frontend

# Instalar dependencias
npm install

# Instalar navegadores de Playwright
npx playwright install

# Ejecutar pruebas E2E
npm run test:e2e

# Ejecutar con interfaz visual
npm run test:e2e:ui

# Ejecutar con navegador visible
npm run test:e2e:headed

# Ejecutar pruebas específicas
npx playwright test auth.spec.js
npx playwright test --grep "login"
```

### **🔗 Integration Tests**
```bash
# Configurar base de datos de prueba
docker run --name trinity_test_db -e POSTGRES_DB=trinity_test -e POSTGRES_HOST_AUTH_METHOD=trust -p 5433:5432 -d postgres:16

# Ejecutar pruebas de integración
cd backend
TEST_DATABASE_URL=postgresql://postgres@localhost:5433/trinity_test npm test integration.test.js
```

## 🎯 **Tipos de Pruebas Implementadas**

### **🔧 Backend (API Tests)**
- ✅ **Autenticación**: Login, tokens JWT, validaciones
- ✅ **CRUD Clientes**: Crear, leer, actualizar, eliminar
- ✅ **CRUD Citas**: Gestión completa con validaciones
- ✅ **Middleware**: Autenticación y control de roles
- ✅ **Validaciones**: Datos requeridos, formatos
- ✅ **Errores**: Manejo de excepciones y códigos HTTP

### **🌐 Frontend (E2E Tests)**
- ✅ **Autenticación**: Login/logout, validaciones
- ✅ **Navegación**: Rutas, sidebar, responsive
- ✅ **Roles**: Control de acceso por usuario
- ✅ **Formularios**: Validaciones, modales
- ✅ **UI/UX**: Componentes, estados, feedback

### **🔗 Integration Tests**
- ✅ **Flujos completos**: Login → CRUD → Logout
- ✅ **Base de datos real**: Conexiones, transacciones
- ✅ **APIs combinadas**: Múltiples endpoints
- ✅ **Escenarios reales**: Casos de uso completos

## 🚀 **Configuración de CI/CD**

### **GitHub Actions Pipeline:**
1. **🔧 Backend Tests** - Jest + Base de datos PostgreSQL
2. **🌐 Frontend Tests** - Playwright + Múltiples navegadores
3. **📊 Coverage Reports** - Codecov integration
4. **🚀 Deploy** - Automático en main branch

### **Ejecutar CI localmente:**
```bash
# Simular el pipeline completo
docker compose up -d db
cd backend && npm test
cd ../frontend && npm run test:e2e
```

## 📊 **Reportes y Métricas**

### **Coverage Reports:**
```bash
# Backend coverage
cd backend && npm run test:coverage
open coverage/lcov-report/index.html

# Frontend coverage (con Playwright)
cd frontend && npx playwright test --reporter=html
npx playwright show-report
```

### **Métricas de Calidad:**
- **Code Coverage**: >80% objetivo
- **Test Success Rate**: >95% objetivo
- **Performance**: <2s load time
- **Accessibility**: WCAG AA compliance

## 🎯 **Estrategia de Testing**

### **🔺 Pirámide de Pruebas:**
```
        🌐 E2E Tests (Playwright)
           ↗️ Pocos, críticos ↖️
      
    🔗 Integration Tests (Jest + DB)
       ↗️ Moderados, flujos ↖️
    
🔧 Unit Tests (Jest + Mocks)
  ↗️ Muchos, rápidos, específicos ↖️
```

### **🎪 Escenarios de Prueba:**

#### **Críticos (E2E):**
- Login/logout de todos los roles
- Crear cita completa (cliente → servicios → confirmación)
- Prevención de conflictos de horarios
- Navegación y permisos por rol

#### **Importantes (Integration):**
- CRUD completo de cada entidad
- Validaciones de negocio
- Manejo de errores de BD
- Autenticación y autorización

#### **Detallados (Unit):**
- Funciones individuales
- Validaciones de entrada
- Transformaciones de datos
- Lógica de negocio específica

## 🛠️ **Comandos de Desarrollo con Tests**

### **Desarrollo con TDD:**
```bash
# Terminal 1: Base de datos
docker compose up -d db

# Terminal 2: Backend con tests
cd backend && npm run test:watch

# Terminal 3: Frontend con tests
cd frontend && npm run test:e2e:ui

# Terminal 4: Servidor de desarrollo
cd frontend && npm run dev
```

### **Pre-commit Hooks:**
```bash
# Instalar husky para hooks
npm install --save-dev husky
npx husky install

# Hook pre-commit
npx husky add .husky/pre-commit "cd backend && npm test && cd ../frontend && npm run test:e2e"
```

## 🎉 **Beneficios de Esta Configuración:**

1. **🔒 Confiabilidad**: Detecta bugs antes de producción
2. **🚀 Velocidad**: CI/CD automático en cada push
3. **📊 Visibilidad**: Reportes de cobertura y calidad
4. **🛡️ Seguridad**: Pruebas de autenticación y autorización
5. **🎯 Calidad**: Mantiene estándares altos de código
6. **🔄 Regresión**: Previene que nuevos cambios rompan funcionalidad existente

¿Te gustaría que implemente alguna de estas configuraciones específicas o que profundice en algún tipo de prueba en particular?
