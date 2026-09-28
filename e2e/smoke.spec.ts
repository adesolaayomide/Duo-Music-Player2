import { test, expect } from '@playwright/test';

test('home page loads and shows navigation', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('[aria-label="Main navigation"], [aria-label="Mobile navigation"]');
  await expect(nav.first()).toBeVisible();
  await expect(page).toHaveTitle(/Duo/i);
});

test('search page is reachable', async ({ page }) => {
  await page.goto('/search');
  await expect(page.locator('main, [role="main"]')).toBeVisible();
});

test('player core plays sample queue and survives route navigation', async ({ page }) => {
  await page.goto('/');

  // Verify initial idle state in desktop player bar
  const playerBar = page.locator('footer[aria-label="Audio player"]');
  await expect(playerBar).toBeVisible();
  await expect(playerBar).toContainText('No track playing');

  // Click the dev-only Play sample queue button
  const playSampleBtn = page.locator('[data-testid="play-sample-queue-btn"]');
  await expect(playSampleBtn).toBeVisible();
  await playSampleBtn.click();

  // Verify PlayerBar loads the first track
  await expect(playerBar).toContainText('Ambient Breeze');
  await expect(playerBar).toContainText('Echo Horizon');

  // Verify play/pause button is present and accessible
  const playButton = playerBar.getByRole('button', { name: /^(play|pause)$/i });
  await expect(playButton).toBeVisible();

  // Test toggling playback
  await playButton.click(); // Pause
  await expect(playerBar.getByRole('button', { name: /^play$/i })).toBeVisible();

  await playButton.click(); // Resume
  await expect(playerBar.getByRole('button', { name: /^(play|pause)$/i })).toBeVisible();

  // Open Queue Panel
  const queueButton = playerBar.getByRole('button', { name: /toggle play queue/i });
  await queueButton.click();

  const queueDialog = page.locator('div[role="dialog"][aria-label="Play Queue"]');
  await expect(queueDialog).toBeVisible();
  await expect(queueDialog).toContainText('Ambient Breeze');
  await expect(queueDialog).toContainText('Midnight Drive');
  await expect(queueDialog).toContainText('Solar Drift');

  // Close queue panel
  await queueDialog.getByRole('button', { name: /close queue/i }).click();
  await expect(queueDialog).not.toBeVisible();

  // Route navigation test: navigate to /search while music is loaded
  const searchLink = page.getByRole('link', { name: 'Search', exact: true });
  await searchLink.click();
  await expect(page).toHaveURL(/\/search/);

  // Assert PlayerBar is still mounted with track information
  await expect(playerBar).toBeVisible();
  await expect(playerBar).toContainText('Ambient Breeze');

  // Navigate back to Home via client-side link
  const homeLink = page.getByRole('link', { name: 'Home', exact: true });
  await homeLink.click();
  await expect(page).toHaveURL('/');
  await expect(playerBar).toBeVisible();
  await expect(playerBar).toContainText('Ambient Breeze');
});
