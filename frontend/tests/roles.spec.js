import { test, expect } from '@playwright/test';

test.describe('👥 Control de Acceso por Roles', () => {
  
  test.describe('🔑 Admin - Acceso Completo', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.fill('input[name="email"]', 'admin@trinity.local');
      await page.fill('input[name="password"]', 'admin');
      await page.click('button[type="submit"]');
    });

    test('✅ Admin debe ver todas las secciones', async ({ page }) => {
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Citas')).toBeVisible();
      await expect(page.locator('text=Clientes')).toBeVisible();
      await expect(page.locator('text=Servicios')).toBeVisible();
      await expect(page.locator('text=Usuarios')).toBeVisible();
      await expect(page.locator('text=Reportes')).toBeVisible();
    });

    test('✅ Admin debe poder acceder a gestión de usuarios', async ({ page }) => {
      await page.click('text=Usuarios');
      await expect(page).toHaveURL('/users');
      await expect(page.locator('h2')).toContainText('Gestión de Usuarios');
    });
  });

  test.describe('📞 Recepción - Acceso Limitado', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.fill('input[name="email"]', 'recepcion@trinity.local');
      await page.fill('input[name="password"]', 'admin');
      await page.click('button[type="submit"]');
    });

    test('✅ Recepción debe ver secciones permitidas', async ({ page }) => {
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Citas')).toBeVisible();
      await expect(page.locator('text=Clientes')).toBeVisible();
      await expect(page.locator('text=Servicios')).toBeVisible();
      await expect(page.locator('text=Reportes')).toBeVisible();
    });

    test('❌ Recepción NO debe ver gestión de usuarios', async ({ page }) => {
      await expect(page.locator('text=Usuarios')).not.toBeVisible();
    });

    test('✅ Recepción debe poder acceder a clientes', async ({ page }) => {
      await page.click('text=Clientes');
      await expect(page).toHaveURL('/customers');
    });
  });

  test.describe('✂️ Estilista - Acceso Mínimo', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.fill('input[name="email"]', 'stylist@trinity.local');
      await page.fill('input[name="password"]', 'admin');
      await page.click('button[type="submit"]');
    });

    test('✅ Estilista debe ver solo secciones permitidas', async ({ page }) => {
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Citas')).toBeVisible();
    });

    test('❌ Estilista NO debe ver secciones restringidas', async ({ page }) => {
      await expect(page.locator('text=Clientes')).not.toBeVisible();
      await expect(page.locator('text=Servicios')).not.toBeVisible();
      await expect(page.locator('text=Usuarios')).not.toBeVisible();
      await expect(page.locator('text=Reportes')).not.toBeVisible();
    });

    test('✅ Estilista debe poder ver sus citas', async ({ page }) => {
      await page.click('text=Citas');
      await expect(page).toHaveURL('/appointments');
      await expect(page.locator('h1')).toContainText('Citas');
    });

    test('❌ Estilista debe ser redirigido si intenta acceder a usuarios', async ({ page }) => {
      await page.goto('/users');
      await expect(page).toHaveURL('/');
    });
  });
});
