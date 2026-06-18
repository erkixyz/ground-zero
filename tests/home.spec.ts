import { test, expect } from "@playwright/test";
import { createTestNote, deleteTestNote } from "./helpers";

const API = "http://localhost:3001";

test.describe("Avaleht — märkmed", () => {
  test("leht laadib korrektselt", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Ground Zero/);
    await expect(page.getByRole("button", { name: "Lisa märge" })).toBeVisible();
  });

  test("märgete lisamisvorm sisaldab kohustuslikke välju", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("Pealkiri")).toBeVisible();
    await expect(page.getByLabel("Sisu")).toBeVisible();
    await expect(page.getByRole("button", { name: "Lisa märge" })).toBeVisible();
  });

  test("saab lisada uue märkme", async ({ page, request }) => {
    const title = `Playwright test ${Date.now()}`;

    await page.goto("/");
    await page.getByLabel("Pealkiri").fill(title);
    await page.getByLabel("Sisu").fill("See on automaatne testisissekanne.");
    await page.getByRole("button", { name: "Lisa märge" }).click();

    await expect(page.getByText(title)).toBeVisible({ timeout: 8000 });

    const res = await request.get(`${API}/api/notes`);
    const notes = await res.json();
    const created = notes.find((n: { title: string }) => n.title === title);
    if (created) await deleteTestNote(request, created.id);
  });

  test("anonüümsel märkmel on 'Anonüümne' silt", async ({ page, request }) => {
    const title = `Anon test ${Date.now()}`;
    const created = await createTestNote(request, title);

    await page.goto("/");
    const noteCard = page.locator(".MuiCard-root").filter({ hasText: title });
    await expect(noteCard).toBeVisible({ timeout: 5000 });
    await expect(noteCard.getByText("Anonüümne")).toBeVisible();

    await deleteTestNote(request, created.id);
  });

  test("märkmel kuvatakse kategooria silt", async ({ page, request }) => {
    const res = await request.post(`${API}/api/notes`, {
      data: { title: `Kategooria test ${Date.now()}`, content: "sisu", category: "too" },
    });
    const created = await res.json();

    await page.goto("/");
    const noteCard = page.locator(".MuiCard-root").filter({ hasText: created.title });
    await expect(noteCard.getByText("Töö")).toBeVisible({ timeout: 5000 });

    await deleteTestNote(request, created.id);
  });

  test("saab märkme kustutada", async ({ page, request }) => {
    const title = `Kustuta test ${Date.now()}`;
    const created = await createTestNote(request, title);

    await page.goto("/");
    const noteCard = page.locator(".MuiCard-root").filter({ hasText: title });
    await expect(noteCard).toBeVisible({ timeout: 5000 });

    await noteCard.getByRole("button", { name: /kustuta/i }).click();
    await expect(page.getByText(title)).not.toBeVisible({ timeout: 5000 });

    await deleteTestNote(request, created.id).catch(() => {});
  });

  test("tähtsustatud märge on esile tõstetud äärjoonega", async ({ page, request }) => {
    const res = await request.post(`${API}/api/notes`, {
      data: { title: `Pinnitud test ${Date.now()}`, content: "sisu", pinned: true },
    });
    const created = await res.json();

    await page.goto("/");
    const noteCard = page.locator(".MuiCard-root").filter({ hasText: created.title });
    await expect(noteCard).toBeVisible({ timeout: 5000 });

    const borderColor = await noteCard.evaluate((el: Element) =>
      getComputedStyle(el).borderColor,
    );
    expect(borderColor).not.toBe("rgba(0, 0, 0, 0)");

    await deleteTestNote(request, created.id);
  });
});
