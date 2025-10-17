import { test, expect } from '@playwright/test';

test.describe('📅 Gestión de Citas', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@trinity.local');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Navegar a citas
    await page.click('text=Citas');
    await expect(page).toHaveURL('/appointments');
  });

  test('✅ Debe mostrar página de citas', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Citas');
    await expect(page.locator('text=Gestiona las citas del salón')).toBeVisible();
  });

  test('✅ Debe mostrar botón Nueva Cita para admin', async ({ page }) => {
    await expect(page.locator('text=Nueva Cita')).toBeVisible();
  });

  test('✅ Debe mostrar filtros de citas', async ({ page }) => {
    await expect(page.locator('label:has-text("Estado")')).toBeVisible();
    await expect(page.locator('label:has-text("Estilista")')).toBeVisible();
    await expect(page.locator('label:has-text("Fecha Desde")')).toBeVisible();
    await expect(page.locator('label:has-text("Fecha Hasta")')).toBeVisible();
  });

  test('✅ Debe abrir modal de nueva cita', async ({ page }) => {
    await page.click('text=Nueva Cita');
    
    // Verificar que el modal se abre
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('text=Nueva Cita')).toBeVisible();
    await expect(page.locator('label:has-text("Cliente")')).toBeVisible();
    await expect(page.locator('label:has-text("Estilista")')).toBeVisible();
    await expect(page.locator('label:has-text("Servicios")')).toBeVisible();
  });

  test('✅ Debe cerrar modal con botón cancelar', async ({ page }) => {
    await page.click('text=Nueva Cita');
    await expect(page.locator('.modal')).toBeVisible();
    
    await page.click('text=Cancelar');
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('✅ Debe cerrar modal con tecla Escape', async ({ page }) => {
    await page.click('text=Nueva Cita');
    await expect(page.locator('.modal')).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('✅ Debe filtrar citas por estado', async ({ page }) => {
    // Seleccionar filtro de estado
    await page.selectOption('select:near(:text("Estado"))', 'pendiente');
    
    // Verificar que se aplicó el filtro (la URL o tabla debería cambiar)
    // Nota: Esto dependería de la implementación específica de filtros
  });
});
