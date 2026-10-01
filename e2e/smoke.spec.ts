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
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const playerBar = page.locator('footer[aria-label="Audio player"]');
  await expect(playerBar).toBeVisible();
  await expect(playerBar).toContainText("No track playing");

  // Play an album or track card from the home page
  const playButton = page.locator('button[aria-label^="Play "]').first();
  await expect(playButton).toBeVisible({ timeout: 15000 });
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
  await genreLink.scrollIntoViewIfNeeded();
  await genreLink.click();
  await expect(page).toHaveURL(/\/genre\/electronic/);
  await expect(page.getByRole("heading", { name: "Electronic" })).toBeVisible();

  // Assert PlayerBar is STILL mounted and playing
  await expect(playerBar).toBeVisible();
  await expect(playerBar).not.toContainText("No track playing");
});

test("guest authentication signs in and updates TopBar profile", async ({
  page,
}) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Welcome back")).toBeVisible({ timeout: 10000 });

  // Click guest demo button
  const guestBtn = page.getByRole("button", { name: /Continue as Guest/i });
  await expect(guestBtn).toBeVisible();
  await guestBtn.click();

  // Should navigate back to home
  await expect(page).toHaveURL("/");

  // TopBar should now show user profile button instead of "Log in"
  const userMenuBtn = page.locator('button[aria-label="User profile menu"]');
  await expect(userMenuBtn).toBeVisible({ timeout: 10000 });
});

test("liking a track persists and appears on /liked page", async ({ page }) => {
  await page.goto("/search?q=acoustic");

  // Wait for track rows in search results
  const trackRow = page
    .locator('div[role="button"]')
    .filter({ hasText: /acoustic/i })
    .first();
  await expect(trackRow).toBeVisible({ timeout: 15000 });

  // Hover and click like button on TrackRow
  await trackRow.hover();
  const likeBtn = trackRow.locator('button[aria-label="Like track"]');
  await expect(likeBtn).toBeVisible();
  await likeBtn.click();

  // Navigate to Liked Songs
  await page.goto("/liked");
  await expect(
    page.getByRole("heading", { name: "Liked Songs" }),
  ).toBeVisible();

  // Should show 1 song on the liked page
  await expect(
    page.locator("main").getByText("1 song", { exact: true }),
  ).toBeVisible({
    timeout: 10000,
  });
});

test("creating custom playlist adds to library and sidebar", async ({
  page,
}) => {
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "Your Library" }),
  ).toBeVisible();

  // Click create playlist button
  const createBtn = page
    .getByRole("button", { name: /Create playlist/i })
    .first();
  await createBtn.click();

  // Fill modal
  const nameInput = page.getByPlaceholder(/Chill Beats/i);
  await expect(nameInput).toBeVisible();
  await nameInput.fill("My E2E Playlist");

  const saveBtn = page.getByRole("button", { name: "Create", exact: true });
  await saveBtn.click();

  // Playlist should now appear in library grid and sidebar
  await expect(
    page.locator("#main-content").getByText("My E2E Playlist"),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.locator("aside").getByText("My E2E Playlist")).toBeVisible({
    timeout: 10000,
  });
});
