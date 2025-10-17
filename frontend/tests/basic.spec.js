import { test, expect } from '@playwright/test';

test.describe('🧪 Pruebas Básicas de TRINITY Frontend', () => {
  
  test('✅ Debe cargar la página de login', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Verificar que la página carga
    await expect(page).toHaveTitle(/TRINITY/);
    
    // Verificar elementos principales
    await expect(page.locator('h1')).toContainText('TRINITY');
    await expect(page.locator('text=Sistema de Gestión de Salón')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Iniciar Sesión');
  });

  test('✅ Debe mostrar formulario de login', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Verificar campos del formulario
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verificar que tiene valores por defecto
    await expect(page.locator('input[name="email"]')).toHaveValue('admin@trinity.local');
    await expect(page.locator('input[name="password"]')).toHaveValue('admin');
  });

  test('✅ Debe mostrar usuarios de prueba', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Verificar sección de usuarios de prueba
    await expect(page.locator('text=Usuarios de prueba')).toBeVisible();
    await expect(page.locator('text=admin@trinity.local')).toBeVisible();
    await expect(page.locator('text=recepcion@trinity.local')).toBeVisible();
    await expect(page.locator('text=stylist@trinity.local')).toBeVisible();
  });

  test('✅ Debe poder mostrar/ocultar contraseña', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
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

  test('✅ Debe tener diseño responsive', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Verificar en desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.card')).toBeVisible();
    
    // Verificar en mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.card')).toBeVisible();
    await expect(page.locator('h1')).toContainText('TRINITY');
  });
});
