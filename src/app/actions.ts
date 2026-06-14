"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createNote(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  if (!title || !content) return;

  await prisma.note.create({ data: { title, content } });
  revalidatePath("/");
}

export async function deleteNote(id: number) {
  await prisma.note.delete({ where: { id } });
  revalidatePath("/");
}
