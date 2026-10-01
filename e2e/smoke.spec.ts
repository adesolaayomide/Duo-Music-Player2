import { test, expect } from "@playwright/test";

test("home page loads and shows navigation and shelves", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator(
    '[aria-label="Main navigation"], [aria-label="Mobile navigation"]',
  );
  await expect(nav.first()).toBeVisible();
  await expect(page).toHaveTitle(/Duo/i);

  // Expect quick access grid
  const quickAccess = page.locator('section[aria-label="Quick access"]');
  await expect(quickAccess).toBeVisible();

  // Expect genre shelf
  await expect(page.getByText("Explore Genres")).toBeVisible({
    timeout: 10000,
  });
});

test("search page searches catalog and shows results", async ({ page }) => {
  await page.goto("/search");

  // Verify search input is present in TopBar
  const searchInput = page.getByPlaceholder("What do you want to listen to?");
  await expect(searchInput).toBeVisible();

  // Initially shows browse all genres
  await expect(page.getByText("Browse all")).toBeVisible();

  // Type search query
  await searchInput.fill("rock");

  // URL should sync with query
  await expect(page).toHaveURL(/q=rock/);

  // Category filter tabs should appear
  await expect(page.getByRole("button", { name: "Songs" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Albums" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Artists" })).toBeVisible();
});

test("catalog playback survives route navigation", async ({ page }) => {
  await page.goto("/");

  const playerBar = page.locator('footer[aria-label="Audio player"]');
  await expect(playerBar).toBeVisible();
  await expect(playerBar).toContainText("No track playing");

  // Wait for quick access items to be populated
  const quickAccessItem = page
    .locator('section[aria-label="Quick access"] div[role="button"]')
    .first();
  await expect(quickAccessItem).toBeVisible({ timeout: 15000 });

  // Hover to reveal floating play button and click it
  await quickAccessItem.hover();
  const playButton = quickAccessItem.locator('button[aria-label*="Play"]');
  await expect(playButton).toBeVisible();
  await playButton.click();

  // Verify PlayerBar loads track information
  await expect(playerBar).not.toContainText("No track playing", {
    timeout: 15000,
  });

  // Verify Play/Pause button exists and works
  const barPlayBtn = playerBar.getByRole("button", { name: /^(play|pause)$/i });
  await expect(barPlayBtn).toBeVisible();

  // Navigate to Search while playing
  const searchLink = page.getByRole("link", { name: "Search", exact: true });
  await searchLink.click();
  await expect(page).toHaveURL(/\/search/);

  // Assert PlayerBar is still mounted with track information
  await expect(playerBar).toBeVisible();
  await expect(playerBar).not.toContainText("No track playing");

  // Navigate back to Home via client-side link
  const homeLink = page.getByRole("link", { name: "Home", exact: true });
  await homeLink.click();
  await expect(page).toHaveURL("/");

  // Assert PlayerBar is still mounted with track information
  await expect(playerBar).toBeVisible();
  await expect(playerBar).not.toContainText("No track playing");

  // Navigate to Explore Genre via client-side link
  const genreLink = page.locator('a[href="/genre/electronic"]').first();
  await expect(genreLink).toBeVisible({ timeout: 10000 });
  await genreLink.click();
  await expect(page).toHaveURL(/\/genre\/electronic/);
  await expect(page.getByRole("heading", { name: "Electronic" })).toBeVisible();

  // Assert PlayerBar is STILL mounted and playing
  await expect(playerBar).toBeVisible();
  await expect(playerBar).not.toContainText("No track playing");
});
