import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const { title, content } = await request.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "title ja content on kohustuslikud" },
      { status: 400 }
    );
  }

  const note = await prisma.note.create({ data: { title, content } });
  return NextResponse.json(note, { status: 201 });
}
