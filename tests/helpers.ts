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
  // Use better-auth signup (public endpoint — no auth required)
  await request.post(`${API}/api/auth/sign-up/email`, {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password,
      name: `${TEST_USER.firstName} ${TEST_USER.lastName}`,
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
    },
  });

  // Promote to GLOBAL_ADMIN and ensure email is verified
  const id = psql(`SELECT id FROM "User" WHERE email='${TEST_USER.email}'`).trim();
  psql(`UPDATE "User" SET roles=ARRAY['GLOBAL_ADMIN'], "emailVerified"=true WHERE email='${TEST_USER.email}'`);
  return { id: id || undefined };
}

export async function getAuthCookie(request: APIRequestContext): Promise<string> {
  await createTestUser(request);
  const res = await request.post(`${API}/api/auth/sign-in/email`, {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  return res.headers()["set-cookie"] ?? "";
}

export async function deleteTestUser(request: APIRequestContext, id: string | number) {
  const cookie = await getAuthCookie(request);
  const res = await request.delete(`${API}/api/users/${id}`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  if (!res.ok()) {
    // API rejects (e.g. self-deletion forbidden) — delete via psql directly
    psql(`DELETE FROM "User" WHERE id='${id}'`);
  }
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
  const cookie = await getAuthCookie(request);
  const res = await request.post(`${API}/api/clients`, {
    data: { country: "EE", ...data },
    headers: cookie ? { Cookie: cookie } : {},
  });
  return res.json();
}

export async function deleteTestClient(request: APIRequestContext, id: string) {
  const cookie = await getAuthCookie(request);
  await request.delete(`${API}/api/clients/${id}`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
}
