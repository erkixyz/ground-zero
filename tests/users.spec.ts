import { test, expect, type Page } from "@playwright/test";
import { API, createTestUser, deleteTestUser } from "./helpers";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Logi sisse" }).click();
  await page.getByLabel("E-post").fill(email);
  await page.getByLabel("Parool").fill(password);
  await page.getByRole("dialog").getByRole("button", { name: "Logi sisse" }).click();
  await expect(page.getByRole("button", { name: "Logi sisse" })).not.toBeVisible({ timeout: 5000 });
}

test.describe("Kasutajate haldus", () => {
  let adminId: number;

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request);
    adminId = user.id;
  });

  test.afterAll(async ({ request }) => {
    if (adminId) await deleteTestUser(request, adminId);
  });

  test("kasutajate leht laadib", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByRole("button", { name: "Lisa kasutaja" })).toBeVisible();
  });

  test("kasutajate tabel kuvab veerupäiseid", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByText("Eesnimi")).toBeVisible();
    await expect(page.getByText("Perenimi")).toBeVisible();
    await expect(page.getByText("E-post")).toBeVisible();
  });

  test("saab luua uue kasutaja", async ({ page, request }) => {
    const email = `new-user-${Date.now()}@test.local`;

    await page.goto("/users");
    await page.getByRole("button", { name: "Lisa kasutaja" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Eesnimi").fill("Uus");
    await dialog.getByLabel("Perekonnanimi").fill("Kasutaja");
    await dialog.getByLabel("E-post").fill(email);
    await dialog.getByLabel("Parool").fill("Parool1234!");
    await dialog.getByRole("button", { name: /salvesta|lisa/i }).click();

    await expect(page.getByText(email)).toBeVisible({ timeout: 8000 });

    const res = await request.get(`${API}/api/users`);
    const users = await res.json();
    const created = users.find((u: { email: string }) => u.email === email);
    if (created) await deleteTestUser(request, created.id);
  });

  test("kasutaja kustutamine küsib kinnitust", async ({ page }) => {
    await page.goto("/users");

    const rows = page.getByRole("row");
    await expect(rows.nth(1)).toBeVisible({ timeout: 5000 });
    await rows.nth(1).getByRole("button", { name: "Kustuta" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/kas oled kindel/i)).toBeVisible();

    await page.getByRole("button", { name: "Tühista" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("kasutaja redigeerimise dialoog avaneb eelnevate andmetega", async ({ page }) => {
    await page.goto("/users");

    const rows = page.getByRole("row");
    await expect(rows.nth(1)).toBeVisible({ timeout: 5000 });
    await rows.nth(1).getByRole("button", { name: "Muuda" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const eesnimiFilled = await dialog.getByLabel("Eesnimi").inputValue();
    expect(eesnimiFilled.length).toBeGreaterThan(0);
  });

  test("iseenda kustutamise nupp on keelatud", async ({ page }) => {
    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/users");

    const rows = page.getByRole("row");
    const count = await rows.count();

    for (let i = 1; i < count; i++) {
      const row = rows.nth(i);
      const emailCell = await row.locator("td").nth(2).textContent();
      if (emailCell?.trim() === "playwright@test.local") {
        await expect(row.getByRole("button", { name: "Kustuta" })).toBeDisabled();
        break;
      }
    }
  });
});
