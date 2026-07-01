import { test, expect } from "@playwright/test";

test.describe("Navigatsioon ja TopBar", () => {
  test("topbar kuvab rakenduse nime", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByText("Ground Zero")).toBeVisible();
  });

  test("'Märkmed' link viib avalehele", async ({ page }) => {
    await page.goto("/users");
    await page.getByRole("link", { name: "Märkmed" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: "Lisa märge" })).toBeVisible();
  });

  test("'Kasutajad' link viib kasutajate lehele", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Kasutajad" }).click();
    await expect(page).toHaveURL("/users");
  });

  test("tööriistade sahtel avaneb ja kuvab teenuste lingid", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tööriistad" }).click();

    await expect(page.getByText("Grafana", { exact: true })).toBeVisible();
    await expect(page.getByText("Prometheus", { exact: true })).toBeVisible();
    await expect(page.getByText("Loki", { exact: true })).toBeVisible();
    await expect(page.getByText("RabbitMQ", { exact: true })).toBeVisible();
    await expect(page.getByText("MinIO", { exact: true })).toBeVisible();
    await expect(page.getByText("Swagger UI", { exact: true })).toBeVisible();
  });

  test("tööriistade sahtli Grafana link on korrektne", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tööriistad" }).click();

    const grafanaLink = page.getByRole("link", { name: /grafana/i }).first();
    await expect(grafanaLink).toHaveAttribute("href", "http://localhost:3002");
    await expect(grafanaLink).toHaveAttribute("target", "_blank");
  });

  test("tööriistade sahtel sulgub Escape klahviga", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tööriistad" }).click();
    await expect(page.getByText("Grafana", { exact: true })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByText("Grafana", { exact: true })).not.toBeVisible();
  });

  test("README drawer avaneb", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "README" }).click();
    await expect(page.getByRole("presentation")).toBeVisible();
  });
});
