import { test, expect } from '@playwright/test';

test.describe('🔐 Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('✅ Debe mostrar página de login', async ({ page }) => {
    await expect(page).toHaveTitle(/TRINITY/);
    await expect(page.locator('h1')).toContainText('TRINITY');
    await expect(page.locator('h2')).toContainText('Iniciar Sesión');
  });

  test('✅ Debe hacer login exitoso con admin', async ({ page }) => {
    // Llenar formulario de login
    await page.fill('input[name="email"]', 'admin@trinity.local');
    await page.fill('input[name="password"]', 'admin');
    
    // Hacer click en login
    await page.click('button[type="submit"]');
    
    // Verificar redirección al dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('¡Hola');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('❌ Debe fallar con credenciales incorrectas', async ({ page }) => {
    await page.fill('input[name="email"]', 'admin@trinity.local');
    await page.fill('input[name="password"]', 'contraseña_incorrecta');
    
    await page.click('button[type="submit"]');
    
    // Debe mostrar error
    await expect(page.locator('.alert-error')).toBeVisible();
    await expect(page.locator('.alert-error')).toContainText('Invalid credentials');
  });

  test('✅ Debe mostrar/ocultar contraseña', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[type="button"]').last();
    
    // Inicialmente debe ser tipo password
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click en mostrar contraseña
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click en ocultar contraseña
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('✅ Debe mostrar usuarios de prueba', async ({ page }) => {
    await expect(page.locator('text=Usuarios de prueba')).toBeVisible();
    await expect(page.locator('text=admin@trinity.local')).toBeVisible();
    await expect(page.locator('text=recepcion@trinity.local')).toBeVisible();
    await expect(page.locator('text=stylist@trinity.local')).toBeVisible();
  });
});
