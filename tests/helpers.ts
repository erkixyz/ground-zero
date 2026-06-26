import { type APIRequestContext } from "@playwright/test";
import { execSync } from "child_process";

export const API = "http://localhost:3001";

const TEST_USER = {
  firstName: "Playwright",
  lastName: "Test",
  email: "playwright@test.local",
  password: "Test1234!",
};

function psql(sql: string): string {
  return execSync(
    "docker exec -i ground-zero-db-primary-1 psql -U postgres groundzero -t",
    { input: sql, encoding: "utf8" }
  ).trim();
}

export async function createTestUser(request: APIRequestContext) {
  const res = await request.post(`${API}/api/users`, { data: TEST_USER });
  if (res.ok()) {
    const user = await res.json();
    psql(`UPDATE "User" SET role='ADMIN' WHERE email='${TEST_USER.email}'`);
    return user;
  }
  // User already exists — get id from DB and promote
  const id = psql(`SELECT id FROM "User" WHERE email='${TEST_USER.email}'`);
  psql(`UPDATE "User" SET role='ADMIN' WHERE email='${TEST_USER.email}'`);
  return { id: id || undefined };
}

export async function deleteTestUser(request: APIRequestContext, id: number) {
  await request.delete(`${API}/api/users/${id}`);
}

export async function createTestNote(
  request: APIRequestContext,
  title: string,
  content = "Testi sisu",
) {
  const res = await request.post(`${API}/api/notes`, {
    data: { title, content },
  });
  return res.json();
}

export async function deleteTestNote(request: APIRequestContext, id: number) {
  await request.delete(`${API}/api/notes/${id}`);
}

export async function createTestClient(
  request: APIRequestContext,
  data: { name: string; regCode?: string; street?: string; city?: string; zip?: string; country?: string },
) {
  const res = await request.post(`${API}/api/clients`, { data });
  return res.json();
}

export async function deleteTestClient(request: APIRequestContext, id: string) {
  await request.delete(`${API}/api/clients/${id}`);
}
