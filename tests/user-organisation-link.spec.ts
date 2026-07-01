import { test, expect, type Page } from "@playwright/test";
import {
  API,
  createTestUser,
  deleteTestUser,
  createTestOrganisation,
  deleteTestOrganisation,
  createTestClient,
  deleteTestClient,
  getAuthCookie,
  getUserOrganisationId,
} from "./helpers";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Logi sisse" }).click();
  await page.getByRole("dialog").getByLabel("E-post").fill(email);
  await page.getByRole("dialog").getByLabel("Parool").fill(password);
  await page.getByRole("dialog").getByRole("button", { name: "Logi sisse" }).click();
  await expect(page.getByRole("button", { name: "Logi sisse" })).not.toBeVisible({ timeout: 5000 });
}

async function linkUserToOrganisation(
  request: import("@playwright/test").APIRequestContext,
  userId: string,
  organisationId: string | null,
) {
  const cookie = await getAuthCookie(request);
  const res = await request.patch(`${API}/api/users/${userId}`, {
    data: { organisationId },
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  });
  if (!res.ok()) throw new Error(`linkUserToOrganisation failed: ${res.status()} ${await res.text()}`);
}

test.describe("Kasutaja sidumine organisatsiooniga", () => {
  let adminId: string;

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request);
    adminId = user.id;
  });

  test.afterAll(async ({ request }) => {
    if (adminId) await deleteTestUser(request, adminId);
  });

  test("kasutaja vormis ei kuvata enam kliendi valikut, vaid organisatsiooni valikut", async ({ page }) => {
    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/users");
    const adminRow = page.getByRole("row").filter({ hasText: "playwright@test.local" });
    await adminRow.getByRole("button", { name: "Muuda" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Organisatsioon")).toBeVisible();
    await expect(dialog.getByLabel("Klient")).toHaveCount(0);
  });

  test("kasutaja vormis saab organisatsiooni otsida ja valida", async ({ page, request }) => {
    const orgName = `Sidumise test ${Date.now()}`;
    const org = await createTestOrganisation(request, { name: orgName });

    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/users");
    const adminRow = page.getByRole("row").filter({ hasText: "playwright@test.local" });
    await adminRow.getByRole("button", { name: "Muuda" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Organisatsioon").fill(orgName);
    const option = page.getByRole("option", { name: new RegExp(orgName) });
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
    await dialog.getByRole("button", { name: /salvesta/i }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await expect(adminRow.getByText(orgName)).toBeVisible({ timeout: 5000 });

    await deleteTestOrganisation(request, org.id);
  });

  test("kasutaja detailvaade näitab seotud organisatsiooni ja viitab sinna", async ({ page, request }) => {
    const orgName = `Detail sidumine ${Date.now()}`;
    const org = await createTestOrganisation(request, { name: orgName });
    await linkUserToOrganisation(request, adminId, org.id);

    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto(`/users/${adminId}`);
    const orgLink = page.getByRole("link", { name: orgName });
    await expect(orgLink).toBeVisible({ timeout: 5000 });
    await orgLink.click();
    await expect(page).toHaveURL(new RegExp(`/organisations/${org.id}$`));

    await deleteTestOrganisation(request, org.id);
  });

  test("organisatsiooni detailvaade näitab seotud kasutajaid", async ({ page, request }) => {
    const orgName = `Org kasutajad ${Date.now()}`;
    const org = await createTestOrganisation(request, { name: orgName });
    await linkUserToOrganisation(request, adminId, org.id);

    await page.goto(`/organisations/${org.id}`);
    await expect(page.getByText("Seotud kasutajad")).toBeVisible();
    await expect(page.getByRole("link", { name: /Playwright Test/ })).toBeVisible({ timeout: 5000 });

    await deleteTestOrganisation(request, org.id);
  });

  test("organisatsiooni ilma seotud kasutajateta detailvaade näitab tühja teadet", async ({ page, request }) => {
    const org = await createTestOrganisation(request, { name: `Tühi org ${Date.now()}` });

    await page.goto(`/organisations/${org.id}`);
    await expect(page.getByText("Seotud kasutajaid pole")).toBeVisible();

    await deleteTestOrganisation(request, org.id);
  });

  test("organisatsiooni kustutamine eemaldab kasutajalt seose (ei kustuta kasutajat)", async ({ request }) => {
    const org = await createTestOrganisation(request, { name: `Kustutatav org ${Date.now()}` });
    expect(org.id).toBeTruthy();
    await linkUserToOrganisation(request, adminId, org.id);
    expect(getUserOrganisationId(adminId)).toBe(org.id);

    await deleteTestOrganisation(request, org.id);

    expect(getUserOrganisationId(adminId)).toBeNull();
  });

  test("organisatsiooni saab kasutajalt eemaldada vormi kaudu", async ({ page, request }) => {
    const orgName = `Eemalda side ${Date.now()}`;
    const org = await createTestOrganisation(request, { name: orgName });
    await linkUserToOrganisation(request, adminId, org.id);

    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/users");
    const adminRow = page.getByRole("row").filter({ hasText: "playwright@test.local" });
    await expect(adminRow.getByText(orgName)).toBeVisible({ timeout: 5000 });
    await adminRow.getByRole("button", { name: "Muuda" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Organisatsioon")).toHaveValue(orgName);
    // MUI's clear (x) button is only revealed visually on hover — force the click since Playwright's
    // default actionability check requires visibility.
    await dialog.locator('button[aria-label="Clear"]').click({ force: true });
    await dialog.getByRole("button", { name: /salvesta/i }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await expect(adminRow.getByText("—")).toBeVisible({ timeout: 5000 });

    await deleteTestOrganisation(request, org.id);
  });

  test("värskelt loodud kasutajal pole organisatsiooni tabelis", async ({ page, request }) => {
    const email = `no-org-${Date.now()}@test.local`;
    await request.post(`${API}/api/auth/sign-up/email`, {
      data: { email, password: "Test1234!", name: "No Org", firstName: "No", lastName: "Org" },
    });
    const loginRes = await request.post(`${API}/api/auth/sign-in/email`, {
      data: { email, password: "Test1234!" },
    });
    const victimId = (await loginRes.json().catch(() => ({})))?.user?.id;

    await loginAs(page, "playwright@test.local", "Test1234!");
    await page.goto("/users");
    const row = page.getByRole("row").filter({ hasText: email });
    await expect(row).toBeVisible({ timeout: 5000 });
    await expect(row.getByText("—")).toBeVisible();

    if (victimId) await deleteTestUser(request, victimId);
  });

  test("kliendi detailvaates ei kuvata enam seotud kasutajaid", async ({ page, request }) => {
    const client = await createTestClient(request, { name: `Ei kuva kasutajaid ${Date.now()}` });

    await page.goto(`/clients/${client.id}`);
    await expect(page.getByText("Seotud kasutajad")).toHaveCount(0);
    await expect(page.getByText("Seotud kasutajaid pole")).toHaveCount(0);

    await deleteTestClient(request, client.id);
  });
});
