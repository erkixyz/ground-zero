"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type NoteFormState = { noteId: number } | { error: string } | null;

async function forwardCookie() {
  const h = await headers();
  return h.get("cookie") ?? "";
}

export async function createNote(
  _prev: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const category = (formData.get("category") as string) || undefined;
  const pinned = formData.get("pinned") === "on";

  if (!title) return { error: "Pealkiri on kohustuslik" };
  if (!content) return { error: "Sisu on kohustuslik" };

  const cookie = await forwardCookie();

  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify({ title, content, category, pinned }),
    });
  } catch {
    return { error: "API ei vasta — kontrolli ühendust" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message ?? `Salvestamine ebaõnnestus (${res.status})` };
  }

  const note = await res.json();
  revalidatePath("/");
  return { noteId: note.id };
}

export async function deleteNote(id: number) {
  await fetch(`${process.env.API_URL}/api/notes/${id}`, { method: "DELETE" });
  revalidatePath("/");
}

export async function deleteNoteFile(noteId: number, fileId: number) {
  await fetch(`${process.env.API_URL}/api/notes/${noteId}/files/${fileId}`, {
    method: "DELETE",
  });
  revalidatePath("/");
}
