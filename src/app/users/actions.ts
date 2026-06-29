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
  const roles = formData.getAll("roles") as string[];

  if (!firstName) return { error: "Eesnimi on kohustuslik" };
  if (!lastName) return { error: "Perenimi on kohustuslik" };
  if (!email) return { error: "E-post on kohustuslik" };
  if (!password) return { error: "Parool on kohustuslik" };

  const cookie = await forwardCookie();
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ firstName, lastName, email, password, roles: roles.length ? roles : ["USER"] }),
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

export async function updateUser(id: string, _prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) || undefined;
  const roles = formData.getAll("roles") as string[];
  const clientIdRaw = formData.get("clientId") as string | null;
  const clientId = clientIdRaw?.trim() || null;

  if (!firstName) return { error: "Eesnimi on kohustuslik" };
  if (!lastName) return { error: "Perenimi on kohustuslik" };
  if (!email) return { error: "E-post on kohustuslik" };

  const cookie = await forwardCookie();
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ firstName, lastName, email, password, clientId }),
    });
  } catch {
    return { error: "API ei vasta — kontrolli ühendust" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? `Salvestamine ebaõnnestus (${res.status})` };
  }

  // Update roles if provided (separate PATCH /roles endpoint)
  if (roles.length > 0) {
    const rolesResult = await updateUserRoles(id, roles);
    if (rolesResult && "error" in rolesResult) return rolesResult;
  }

  revalidatePath("/users");
  return { ok: true };
}

export async function updateUserRoles(id: string, roles: string[]): Promise<UserFormState> {
  const cookie = await forwardCookie();
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/users/${id}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ roles }),
    });
  } catch {
    return { error: "API ei vasta — kontrolli ühendust" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? `Rollide muutmine ebaõnnestus (${res.status})` };
  }

  revalidatePath("/users");
  return { ok: true };
}

export async function deleteUser(id: string) {
  const cookie = await forwardCookie();
  await fetch(`${process.env.API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: cookie ? { Cookie: cookie } : {},
  });
  revalidatePath("/users");
}
