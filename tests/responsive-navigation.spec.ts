import { test, expect } from "@playwright/test";

test.describe("Navigatsioon — suur ekraan", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("külgriba on nähtav koos kõikide linkidega", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByRole("navigation");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Märkmed" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Kasutajad" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Kliendid" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Organisatsioonid" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "AI Chat" })).toBeVisible();
  });

  test("külgriba tõstab esile praeguse lehe lingi", async ({ page }) => {
    await page.goto("/users");
    const sidebar = page.getByRole("navigation");
    await expect(sidebar.getByRole("link", { name: "Kasutajad" })).toHaveClass(/Mui-selected/);
    await expect(sidebar.getByRole("link", { name: "Märkmed" })).not.toHaveClass(/Mui-selected/);
  });

  test("külgriba link viib õigele lehele", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByRole("navigation");
    await sidebar.getByRole("link", { name: "Kliendid" }).click();
    await expect(page).toHaveURL("/clients");
  });

  test("külgriba README nupp avab sahtli", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByRole("navigation");
    await sidebar.getByRole("button", { name: "README" }).click();
    await expect(page.getByRole("presentation")).toBeVisible();
  });

  test("rakenduse nimi on nähtav ja hamburgermenüü nupp on peidetud", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByText("Ground Zero")).toBeVisible();
    await expect(page.getByRole("button", { name: "Menüü" })).toBeHidden();
  });

  test("alumine mobiilinavigatsioon ei ole nähtav", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".MuiBottomNavigation-root")).toBeHidden();
  });
});

test.describe("Navigatsioon — väike ekraan (mobiil)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("külgriba ei ole nähtav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeHidden();
  });

  test("rakenduse nimi on peidetud", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByText("Ground Zero")).toBeHidden();
  });

  test("alumine navigatsioon on nähtav ja sisaldab kõiki linke", async ({ page }) => {
    await page.goto("/");
    const bottomNav = page.locator(".MuiBottomNavigation-root");
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.locator('a[href="/"]')).toBeVisible();
    await expect(bottomNav.locator('a[href="/users"]')).toBeVisible();
    await expect(bottomNav.locator('a[href="/clients"]')).toBeVisible();
    await expect(bottomNav.locator('a[href="/organisations"]')).toBeVisible();
    await expect(bottomNav.locator('a[href="/chat"]')).toBeVisible();
  });

  test("alumise navigatsiooni link viib õigele lehele ja märgitakse aktiivseks", async ({ page }) => {
    await page.goto("/");
    const bottomNav = page.locator(".MuiBottomNavigation-root");
    await bottomNav.locator('a[href="/users"]').click();
    await expect(page).toHaveURL("/users");
    await expect(bottomNav.locator('a[href="/users"]')).toHaveClass(/Mui-selected/);
  });

  test("hamburgermenüü nupp on nähtav ja avab navigatsioonisahtli", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Menüü" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const drawer = page.getByRole("presentation");
    await expect(drawer.getByRole("link", { name: "Kasutajad" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Kliendid" })).toBeVisible();
  });

  test("navigatsioonisahtli link viib õigele lehele ja sulgeb sahtli", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menüü" }).click();
    const drawer = page.getByRole("presentation");
    await drawer.getByRole("link", { name: "Kasutajad" }).click();

    await expect(page).toHaveURL("/users");
    await expect(drawer).toBeHidden();
  });

  test("otsingu nupp on nähtav ka mobiilivaates", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("button", { name: /otsi/i })).toBeVisible();
  });
});
