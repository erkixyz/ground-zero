"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type ClientFormState = { ok: true } | { error: string } | null;

async function forwardCookie() {
  const h = await headers();
  return h.get("cookie") ?? "";
}

export async function createClient(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const name = (formData.get("name") as string)?.trim();
  const regCode = (formData.get("regCode") as string)?.trim() || undefined;

  if (!name) return { error: "Nimi on kohustuslik" };

  const cookie = await forwardCookie();
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ name, regCode }),
    });
  } catch {
    return { error: "API ei vasta — kontrolli ühendust" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? `Salvestamine ebaõnnestus (${res.status})` };
  }

  revalidatePath("/clients");
  return { ok: true };
}

export async function updateClient(id: string, _prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const name = (formData.get("name") as string)?.trim();
  const regCode = (formData.get("regCode") as string)?.trim() || "";

  if (!name) return { error: "Nimi on kohustuslik" };

  const cookie = await forwardCookie();
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ name, regCode }),
    });
  } catch {
    return { error: "API ei vasta — kontrolli ühendust" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? `Salvestamine ebaõnnestus (${res.status})` };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true };
}

export async function deleteClient(id: string) {
  const cookie = await forwardCookie();
  await fetch(`${process.env.API_URL}/api/clients/${id}`, {
    method: "DELETE",
    headers: cookie ? { Cookie: cookie } : {},
  });
  revalidatePath("/clients");
}
