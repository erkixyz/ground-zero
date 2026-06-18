import { type APIRequestContext } from "@playwright/test";

export const API = "http://localhost:3001";

export async function createTestUser(request: APIRequestContext) {
  const res = await request.post(`${API}/api/users`, {
    data: {
      firstName: "Playwright",
      lastName: "Test",
      email: "playwright@test.local",
      password: "Test1234!",
    },
  });
  return res.json();
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
