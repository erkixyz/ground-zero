import { test, expect } from "@playwright/test";
import {
  createTestNote,
  deleteTestNote,
  createTestClient,
  deleteTestClient,
  createTestOrganisation,
  deleteTestOrganisation,
} from "./helpers";

async function openSearch(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: /otsi/i }).click();
  return page.getByRole("dialog");
}

test.describe("Globaalne otsing", () => {
  test("otsingunupp avab otsingudialoogi fokuseeritud sisendväljaga", async ({ page }) => {
    const dialog = await openSearch(page);
    await expect(dialog).toBeVisible();

    const input = dialog.getByPlaceholder("Otsi märkmeid, kasutajaid, kliente ja organisatsioone…");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("Escape klahv sulgeb otsingudialoogi", async ({ page }) => {
    const dialog = await openSearch(page);
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("tundmatu otsingusõna kuvab 'tulemusi ei leitud' teate", async ({ page }) => {
    const dialog = await openSearch(page);
    const query = `ei-leidu-kunagi-${Date.now()}`;
    await dialog.getByPlaceholder("Otsi märkmeid, kasutajaid, kliente ja organisatsioone…").fill(query);

    await expect(dialog.getByText("Tulemusi ei leitud")).toBeVisible({ timeout: 5000 });
  });

  test("dialoogi taasavamisel on eelmine otsing ja tulemused tühjendatud", async ({ page }) => {
    const dialog = await openSearch(page);
    const input = dialog.getByPlaceholder("Otsi märkmeid, kasutajaid, kliente ja organisatsioone…");
    await input.fill("mingi-otsing");
    await expect(input).toHaveValue("mingi-otsing");

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    const reopened = await openSearch(page);
    await expect(reopened.getByPlaceholder("Otsi märkmeid, kasutajaid, kliente ja organisatsioone…")).toHaveValue("");
  });

  test.describe("tulemused üle andmetüüpide", () => {
    test("leiab märkme pealkirja järgi ja navigeerib sinna", async ({ page, request }) => {
      const title = `Otsingutest märge ${Date.now()}`;
      const note = await createTestNote(request, title, "Ainulaadne sisu otsingu jaoks");

      const dialog = await openSearch(page);
      await dialog.getByPlaceholder("Otsi märkmeid, kasutajaid, kliente ja organisatsioone…").fill(title);

      await expect(dialog.getByText("Märkmed", { exact: true })).toBeVisible({ timeout: 5000 });
      const result = dialog.getByText(title, { exact: true });
      await expect(result).toBeVisible();
      await expect(dialog.locator("mark").filter({ hasText: title.split(" ")[0] })).toBeVisible();

      await result.click();
      await expect(page).toHaveURL(new RegExp(`/notes/${note.id}$`));
      await expect(dialog).not.toBeVisible();

      await deleteTestNote(request, note.id);
    });

    test("leiab kliendi nime järgi ja navigeerib sinna", async ({ page, request }) => {
      const name = `Otsingu Klient ${Date.now()}`;
      const client = await createTestClient(request, { name });

      const dialog = await openSearch(page);
      await dialog.getByPlaceholder("Otsi märkmeid, kasutajaid, kliente ja organisatsioone…").fill(name);

      await expect(dialog.getByText("Kliendid", { exact: true })).toBeVisible({ timeout: 5000 });
      const result = dialog.getByText(name, { exact: true });
      await expect(result).toBeVisible();

      await result.click();
      await expect(page).toHaveURL(new RegExp(`/clients/${client.id}$`));
      await expect(dialog).not.toBeVisible();

      await deleteTestClient(request, client.id);
    });

    test("leiab organisatsiooni nime järgi ja navigeerib sinna", async ({ page, request }) => {
      const name = `Otsingu Organisatsioon ${Date.now()}`;
      const org = await createTestOrganisation(request, { name });

      const dialog = await openSearch(page);
      await dialog.getByPlaceholder("Otsi märkmeid, kasutajaid, kliente ja organisatsioone…").fill(name);

      await expect(dialog.getByText("Organisatsioonid", { exact: true })).toBeVisible({ timeout: 5000 });
      const result = dialog.getByText(name, { exact: true });
      await expect(result).toBeVisible();

      await result.click();
      await expect(page).toHaveURL(new RegExp(`/organisations/${org.id}$`));
      await expect(dialog).not.toBeVisible();

      await deleteTestOrganisation(request, org.id);
    });
  });

  test("nooleklahvidega saab tulemuste vahel liikuda ja Enter navigeerib valitud tulemusele", async ({ page, request }) => {
    const title = `Klaviatuur test ${Date.now()}`;
    const note = await createTestNote(request, title, "Sisu klaviatuurinavigatsiooni testiks");

    const dialog = await openSearch(page);
    await dialog.getByPlaceholder("Otsi märkmeid, kasutajaid, kliente ja organisatsioone…").fill(title);
    await expect(dialog.getByText(title, { exact: true })).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("ArrowDown");
    await expect(dialog.getByRole("button").filter({ hasText: title })).toHaveClass(/Mui-selected/);

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/notes/${note.id}$`));
    await expect(dialog).not.toBeVisible();

    await deleteTestNote(request, note.id);
  });
});

test.describe("Globaalne otsing — väike ekraan (mobiil)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("otsingudialoog avaneb ja toimib mobiilivaates", async ({ page, request }) => {
    const title = `Mobiili otsing ${Date.now()}`;
    const note = await createTestNote(request, title, "Mobiilivaate otsingusisu");

    const dialog = await openSearch(page);
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("Otsi märkmeid, kasutajaid, kliente ja organisatsioone…").fill(title);

    const result = dialog.getByText(title, { exact: true });
    await expect(result).toBeVisible({ timeout: 5000 });
    await result.click();

    await expect(page).toHaveURL(new RegExp(`/notes/${note.id}$`));
    await deleteTestNote(request, note.id);
  });
});
