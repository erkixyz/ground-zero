"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type UserFormState = { ok: true } | { error: string } | null;

async function forwardCookie() {
  const h = await headers();
  return h.get("cookie") ?? "";
}

export async function createUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!firstName) return { error: "Eesnimi on kohustuslik" };
  if (!lastName) return { error: "Perenimi on kohustuslik" };
  if (!email) return { error: "E-post on kohustuslik" };
  if (!password) return { error: "Parool on kohustuslik" };

  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
  } catch {
    return { error: "API ei vasta — kontrolli ühendust" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? `Salvestamine ebaõnnestus (${res.status})` };
  }

  revalidatePath("/users");
  return { ok: true };
}

export async function updateUser(id: number, _prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) || undefined;

  if (!firstName) return { error: "Eesnimi on kohustuslik" };
  if (!lastName) return { error: "Perenimi on kohustuslik" };
  if (!email) return { error: "E-post on kohustuslik" };

  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
  } catch {
    return { error: "API ei vasta — kontrolli ühendust" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? `Salvestamine ebaõnnestus (${res.status})` };
  }

  revalidatePath("/users");
  return { ok: true };
}

export async function deleteUser(id: number) {
  const cookie = await forwardCookie();
  await fetch(`${process.env.API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: cookie ? { Cookie: cookie } : {},
  });
  revalidatePath("/users");
}
