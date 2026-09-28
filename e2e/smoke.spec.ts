import { test, expect } from '@playwright/test';

test('home page loads and shows navigation', async ({ page }) => {
  await page.goto('/');
  // Sidebar or mobile nav present
  const nav = page.locator('[aria-label="Main navigation"], [aria-label="Mobile navigation"]');
  await expect(nav.first()).toBeVisible();
  // Page title
  await expect(page).toHaveTitle(/Duo/i);
});

test('search page is reachable', async ({ page }) => {
  await page.goto('/search');
  await expect(page.locator('main, [role="main"]')).toBeVisible();
});
