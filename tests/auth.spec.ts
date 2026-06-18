import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers";

test.describe("Autentimine", () => {
  let userId: number;

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request);
    userId = user.id;
  });

  test.afterAll(async ({ request }) => {
    if (userId) await deleteTestUser(request, userId);
  });

  test("sisselogimata kasutajale kuvatakse 'Logi sisse' nupp", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Logi sisse" })).toBeVisible();
  });

  test("'Logi sisse' nupp avab dialoogi", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Logi sisse" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("E-post")).toBeVisible();
    await expect(page.getByLabel("Parool")).toBeVisible();
  });

  test("vale parooliga sisselogimine näitab viga", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Logi sisse" }).click();
    await page.getByLabel("E-post").fill("playwright@test.local");
    await page.getByLabel("Parool").fill("vale-parool");
    await page.getByRole("dialog").getByRole("button", { name: "Logi sisse" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 5000 });
  });

  test("tühja vormi esitamine ei sulge dialoogi", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Logi sisse" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Logi sisse" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("õige parooliga sisselogimine õnnestub", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Logi sisse" }).click();
    await page.getByLabel("E-post").fill("playwright@test.local");
    await page.getByLabel("Parool").fill("Test1234!");
    await page.getByRole("dialog").getByRole("button", { name: "Logi sisse" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Logi sisse" })).not.toBeVisible();
    await expect(page.getByText("PT")).toBeVisible();
  });

  test("sisselogitud kasutaja saab välja logida", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Logi sisse" }).click();
    await page.getByLabel("E-post").fill("playwright@test.local");
    await page.getByLabel("Parool").fill("Test1234!");
    await page.getByRole("dialog").getByRole("button", { name: "Logi sisse" }).click();
    await expect(page.getByText("PT")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Logi välja" }).click();
    await expect(page.getByRole("button", { name: "Logi sisse" })).toBeVisible({ timeout: 5000 });
  });

  test("tühista nupp sulgeb dialoogi sisselogimata", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Logi sisse" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Tühista" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Logi sisse" })).toBeVisible();
  });
});
