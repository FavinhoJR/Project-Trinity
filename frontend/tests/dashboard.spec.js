import { test, expect } from '@playwright/test';

test.describe('📊 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@trinity.local');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await expect(page.locator('h1')).toContainText('¡Hola');
  });

  test('✅ Debe mostrar estadísticas del dashboard', async ({ page }) => {
    // Verificar que las tarjetas de estadísticas estén visibles
    await expect(page.locator('text=Total Clientes')).toBeVisible();
    await expect(page.locator('text=Citas del Período')).toBeVisible();
    await expect(page.locator('text=Servicios Activos')).toBeVisible();
    await expect(page.locator('text=Ingresos')).toBeVisible();
  });

  test('✅ Debe mostrar estado de citas', async ({ page }) => {
    await expect(page.locator('text=Estado de Citas')).toBeVisible();
    await expect(page.locator('text=Pendientes')).toBeVisible();
    await expect(page.locator('text=Confirmadas')).toBeVisible();
    await expect(page.locator('text=Completadas')).toBeVisible();
  });

  test('✅ Debe mostrar citas recientes', async ({ page }) => {
    await expect(page.locator('text=Citas Recientes')).toBeVisible();
  });

  test('✅ Debe mostrar navegación en sidebar', async ({ page }) => {
    // Verificar elementos del sidebar
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Citas')).toBeVisible();
    await expect(page.locator('text=Clientes')).toBeVisible();
    await expect(page.locator('text=Servicios')).toBeVisible();
    await expect(page.locator('text=Usuarios')).toBeVisible();
    await expect(page.locator('text=Reportes')).toBeVisible();
  });

  test('✅ Debe navegar a sección de citas', async ({ page }) => {
    await page.click('text=Citas');
    await expect(page).toHaveURL('/appointments');
    await expect(page.locator('h1')).toContainText('Citas');
  });

  test('✅ Debe poder cerrar sesión', async ({ page }) => {
    await page.click('text=Cerrar Sesión');
    
    // Debe redirigir al login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2')).toContainText('Iniciar Sesión');
  });
});
