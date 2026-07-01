import { test, expect } from "@playwright/test";
import { deleteTestNote, API } from "./helpers";

async function createNoteWithFile(
  page: import("@playwright/test").Page,
  title: string,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  await page.goto("/");
  await page.getByLabel("Pealkiri").fill(title);
  await page.getByLabel("Sisu").fill("Faili testimise sisu");
  await page.getByText("Lisa failid").locator("..").locator('input[type="file"]').setInputFiles(file);
  await page.getByRole("button", { name: "Lisa märge" }).click();

  const noteCard = page.locator(".MuiCard-root").filter({ hasText: title });
  await expect(noteCard).toBeVisible({ timeout: 8000 });
  return noteCard;
}

async function findNoteId(request: import("@playwright/test").APIRequestContext, title: string): Promise<number> {
  const res = await request.get(`${API}/api/notes`);
  const notes = await res.json();
  const note = notes.find((n: { title: string }) => n.title === title);
  return note.id;
}

test.describe("Failide üleslaadimine (MinIO)", () => {
  test("faili lisamisel märkmele kuvatakse faili silt", async ({ page, request }) => {
    const title = `MinIO test ${Date.now()}`;
    const noteCard = await createNoteWithFile(page, title, {
      name: "test-fail.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Playwright MinIO testi sisu"),
    });

    await expect(noteCard.getByText("test-fail.txt")).toBeVisible({ timeout: 8000 });

    const noteId = await findNoteId(request, title);
    await deleteTestNote(request, noteId);
  });

  test("faili allalaadimise link tagastab õige sisu MinIO-st", async ({ page, request }) => {
    const title = `MinIO sisu test ${Date.now()}`;
    const content = "Ainulaadne MinIO sisu kontrollimiseks";
    const noteCard = await createNoteWithFile(page, title, {
      name: "sisu-test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });

    const chip = noteCard.getByText("sisu-test.txt");
    await expect(chip).toBeVisible({ timeout: 8000 });
    const href = await chip.locator("xpath=ancestor::a").getAttribute("href");
    expect(href).toMatch(/^http:\/\/localhost:9000\//);

    const fileRes = await request.get(href!);
    expect(fileRes.ok()).toBe(true);
    expect(await fileRes.text()).toBe(content);

    const noteId = await findNoteId(request, title);
    await deleteTestNote(request, noteId);
  });

  test("mitme faili üleslaadimine korraga toimib", async ({ page, request }) => {
    const title = `MinIO mitu faili ${Date.now()}`;
    await page.goto("/");
    await page.getByLabel("Pealkiri").fill(title);
    await page.getByLabel("Sisu").fill("Mitme faili testi sisu");
    await page
      .getByText("Lisa failid")
      .locator("..")
      .locator('input[type="file"]')
      .setInputFiles([
        { name: "esimene.txt", mimeType: "text/plain", buffer: Buffer.from("esimene fail") },
        { name: "teine.txt", mimeType: "text/plain", buffer: Buffer.from("teine fail") },
      ]);
    await page.getByRole("button", { name: "Lisa märge" }).click();

    const noteCard = page.locator(".MuiCard-root").filter({ hasText: title });
    await expect(noteCard).toBeVisible({ timeout: 8000 });
    await expect(noteCard.getByText("esimene.txt")).toBeVisible({ timeout: 8000 });
    await expect(noteCard.getByText("teine.txt")).toBeVisible();

    const noteId = await findNoteId(request, title);
    await deleteTestNote(request, noteId);
  });

  test("faili saab enne salvestamist eemaldada valikust", async ({ page, request }) => {
    const title = `MinIO eemaldatud fail ${Date.now()}`;
    await page.goto("/");
    await page.getByLabel("Pealkiri").fill(title);
    await page.getByLabel("Sisu").fill("Eemaldatud faili sisu");
    await page
      .getByText("Lisa failid")
      .locator("..")
      .locator('input[type="file"]')
      .setInputFiles({ name: "eemalda.txt", mimeType: "text/plain", buffer: Buffer.from("eemaldatav") });

    const pendingChip = page.locator(".MuiChip-root").filter({ hasText: "eemalda.txt" });
    await expect(pendingChip).toBeVisible();
    await pendingChip.locator(".MuiChip-deleteIcon").click();
    await expect(pendingChip).toBeHidden();

    await page.getByRole("button", { name: "Lisa märge" }).click();
    const noteCard = page.locator(".MuiCard-root").filter({ hasText: title });
    await expect(noteCard).toBeVisible({ timeout: 8000 });
    await expect(noteCard.getByText("eemalda.txt")).toHaveCount(0);

    const noteId = await findNoteId(request, title);
    await deleteTestNote(request, noteId);
  });

  test("faili saab märkmelt kustutada pärast salvestamist", async ({ page, request }) => {
    const title = `MinIO kustuta fail ${Date.now()}`;
    const noteCard = await createNoteWithFile(page, title, {
      name: "kustuta.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("kustutatav sisu"),
    });

    const fileChip = noteCard.locator(".MuiChip-root").filter({ hasText: "kustuta.txt" });
    await expect(fileChip).toBeVisible({ timeout: 8000 });
    await fileChip.locator(".MuiChip-deleteIcon").click();
    await expect(fileChip).toBeHidden({ timeout: 5000 });

    const noteId = await findNoteId(request, title);
    await deleteTestNote(request, noteId);
  });

  test("märkme kustutamine kustutab ka sellega seotud failid MinIO-st", async ({ page, request }) => {
    const title = `MinIO kaskaadkustutus ${Date.now()}`;
    const noteCard = await createNoteWithFile(page, title, {
      name: "kaskaad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("kaskaadkustutuse sisu"),
    });
    await expect(noteCard.getByText("kaskaad.txt")).toBeVisible({ timeout: 8000 });

    const noteId = await findNoteId(request, title);
    const beforeDelete = await request.get(`${API}/api/notes/${noteId}`);
    const noteData = await beforeDelete.json();
    const fileUrl = noteData.files[0].url as string;

    await deleteTestNote(request, noteId);

    const fileRes = await request.get(fileUrl);
    expect(fileRes.ok()).toBe(false);
  });
});
