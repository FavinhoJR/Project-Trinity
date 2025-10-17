import { test, expect } from '@playwright/test';

test.describe('🔐 Login Real con Backend', () => {
  
  test('✅ Debe hacer login exitoso y acceder al dashboard', async ({ page }) => {
    // Ir a la página de login
    await page.goto('http://localhost:5173');
    
    // Verificar que estamos en login
    await expect(page.locator('h2')).toContainText('Iniciar Sesión');
    
    // Llenar formulario (ya tiene valores por defecto)
    await expect(page.locator('input[name="email"]')).toHaveValue('admin@trinity.local');
    await expect(page.locator('input[name="password"]')).toHaveValue('admin');
    
    // Hacer click en login
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard (puede tomar un momento)
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verificar que estamos en el dashboard
    await expect(page.locator('h1')).toContainText('¡Hola');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Verificar elementos del dashboard
    await expect(page.locator('text=Total Clientes')).toBeVisible();
    await expect(page.locator('text=Citas del Período')).toBeVisible();
    await expect(page.locator('text=Servicios Activos')).toBeVisible();
    await expect(page.locator('text=Ingresos')).toBeVisible();
  });

  test('✅ Debe mostrar sidebar con navegación', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Verificar elementos del sidebar
    await expect(page.locator('text=TRINITY')).toBeVisible();
    await expect(page.locator('text=Salón de Belleza')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Citas')).toBeVisible();
    await expect(page.locator('text=Clientes')).toBeVisible();
    await expect(page.locator('text=Servicios')).toBeVisible();
    await expect(page.locator('text=Usuarios')).toBeVisible();
    await expect(page.locator('text=Reportes')).toBeVisible();
  });

  test('✅ Debe navegar a sección de citas', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navegar a citas
    await page.click('text=Citas');
    await page.waitForURL('/appointments');
    
    // Verificar página de citas
    await expect(page.locator('h1')).toContainText('Citas');
    await expect(page.locator('text=Gestiona las citas del salón')).toBeVisible();
    await expect(page.locator('text=Nueva Cita')).toBeVisible();
  });

  test('✅ Debe poder cerrar sesión', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Cerrar sesión
    await page.click('text=Cerrar Sesión');
    
    // Verificar que volvimos al login
    await page.waitForURL('/login');
    await expect(page.locator('h2')).toContainText('Iniciar Sesión');
  });
});
