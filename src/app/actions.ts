"use server";

import { revalidatePath } from "next/cache";

export async function createNote(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  if (!title || !content) return;

  await fetch(`${process.env.API_URL}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  revalidatePath("/");
}

export async function deleteNote(id: number) {
  await fetch(`${process.env.API_URL}/api/notes/${id}`, {
    method: "DELETE",
  });
  revalidatePath("/");
}
