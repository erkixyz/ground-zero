"use server";

import { revalidatePath } from "next/cache";

export type NoteFormState = { error: string } | null;

export async function createNote(
  _prev: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  if (!title) return { error: "Pealkiri on kohustuslik" };
  if (!content) return { error: "Sisu on kohustuslik" };

  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
  } catch {
    return { error: "API ei vasta — kontrolli ühendust" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? `Salvestamine ebaõnnestus (${res.status})` };
  }

  revalidatePath("/");
  return null;
}

export async function deleteNote(id: number) {
  await fetch(`${process.env.API_URL}/api/notes/${id}`, { method: "DELETE" });
  revalidatePath("/");
}
