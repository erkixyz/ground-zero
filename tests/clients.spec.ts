import { test, expect, type Page } from "@playwright/test";
import { API, createTestClient, createTestUser, deleteTestClient, deleteTestUser } from "./helpers";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Logi sisse" }).click();
  await page.getByRole("dialog").getByLabel("E-post").fill(email);
  await page.getByRole("dialog").getByLabel("Parool").fill(password);
  await page.getByRole("dialog").getByRole("button", { name: "Logi sisse" }).click();
  await expect(page.getByRole("button", { name: "Logi sisse" })).not.toBeVisible({ timeout: 5000 });
}

test.describe("Klientide haldus", () => {
  let adminId: string;

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request);
    adminId = user.id;
  });

  test.afterAll(async ({ request }) => {
    if (adminId) await deleteTestUser(request, adminId);
  });

  test("klientide leht laadib", async ({ page }) => {
    await page.goto("/clients");
    await expect(page.getByRole("button", { name: "Lisa klient" })).toBeVisible();
  });

  test("klientide tabel kuvab veerupäiseid", async ({ page }) => {
    await page.goto("/clients");
    await expect(page.getByText("Nimi")).toBeVisible();
    await expect(page.getByText("Reg-kood")).toBeVisible();
    await expect(page.getByText("Lisatud")).toBeVisible();
  });

  test("saab luua uue kliendi nimega", async ({ page, request }) => {
    const name = `Playwright Klient ${Date.now()}`;

    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/clients");
    await page.getByRole("button", { name: "Lisa klient" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Nimi").fill(name);
    await dialog.getByRole("button", { name: "Lisa" }).click();

    await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });

    const res = await request.get(`${API}/api/clients`);
    const clients = await res.json();
    const created = clients.find((c: { name: string }) => c.name === name);
    if (created) await deleteTestClient(request, created.id);
  });

  test("saab luua kliendi koos aadressiga", async ({ page, request }) => {
    const name = `Aadress Klient ${Date.now()}`;

    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/clients");
    await page.getByRole("button", { name: "Lisa klient" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Nimi").fill(name);
    await dialog.getByLabel("Reg-kood").fill("11223344");
    await dialog.getByLabel("Tänav, maja, korter").fill("Viru 10");
    await dialog.getByLabel("Sihtnumber").fill("10111");
    await dialog.getByLabel("Linn").fill("Tallinn");

    // Riik on vaikimisi Eesti — jätame muutmata
    await dialog.getByRole("button", { name: "Lisa" }).click();

    await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });

    const res = await request.get(`${API}/api/clients`);
    const clients = await res.json();
    const created = clients.find((c: { name: string }) => c.name === name);
    if (created) await deleteTestClient(request, created.id);
  });

  test("kustutamine küsib kinnitust", async ({ page, request }) => {
    const client = await createTestClient(request, { name: `Kustuta test ${Date.now()}` });

    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/clients");
    const row = page.getByRole("row").filter({ hasText: client.name });
    await expect(row).toBeVisible({ timeout: 5000 });
    await row.getByRole("button", { name: "Kustuta" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/kas oled kindel/i)).toBeVisible();

    await page.getByRole("button", { name: "Tühista" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await deleteTestClient(request, client.id);
  });

  test("kliendi redigeerimise dialoog avaneb eelnevate andmetega", async ({ page, request }) => {
    const client = await createTestClient(request, {
      name: `Muuda test ${Date.now()}`,
      regCode: "55667788",
    });

    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/clients");
    const row = page.getByRole("row").filter({ hasText: client.name });
    await expect(row).toBeVisible({ timeout: 5000 });
    await row.getByRole("button", { name: "Muuda" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByLabel("Nimi");
    await expect(nameInput).toHaveValue(client.name);

    const regInput = dialog.getByLabel("Reg-kood");
    await expect(regInput).toHaveValue("55667788");

    await page.getByRole("button", { name: "Tühista" }).click();
    await deleteTestClient(request, client.id);
  });

  test("kliendi detailvaade kuvab põhiandmed", async ({ page, request }) => {
    const client = await createTestClient(request, {
      name: `Detail test ${Date.now()}`,
      regCode: "99887766",
    });

    await page.goto(`/clients/${client.id}`);
    await expect(page.getByText(client.name)).toBeVisible();
    await expect(page.getByText("99887766")).toBeVisible();

    await deleteTestClient(request, client.id);
  });

  test("kliendi detailvaade kuvab aadressi lipuga", async ({ page, request }) => {
    const client = await createTestClient(request, {
      name: `Aadress detail ${Date.now()}`,
      street: "Narva mnt 5",
      city: "Tallinn",
      zip: "10117",
      country: "EE",
    });

    await page.goto(`/clients/${client.id}`);
    await expect(page.getByText("Narva mnt 5")).toBeVisible();
    await expect(page.getByText(/10117.*Tallinn|Tallinn.*10117/)).toBeVisible();
    // Eesti lipp emoji + nimi
    await expect(page.getByText(/🇪🇪/)).toBeVisible();

    await deleteTestClient(request, client.id);
  });

  test("kliendi nimele klõpsamine avab detailvaate", async ({ page, request }) => {
    const client = await createTestClient(request, { name: `Link test ${Date.now()}` });

    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/clients");
    const row = page.getByRole("row").filter({ hasText: client.name });
    await expect(row).toBeVisible({ timeout: 5000 });
    await row.getByRole("link", { name: client.name }).click();

    await expect(page).toHaveURL(new RegExp(`/clients/${client.id}`));

    await deleteTestClient(request, client.id);
  });
});
