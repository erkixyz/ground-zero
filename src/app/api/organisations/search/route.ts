import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const res = await fetch(
    `${process.env.API_URL}/api/organisations/search?q=${encodeURIComponent(q)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return NextResponse.json([], { status: res.status });
  return NextResponse.json(await res.json());
}
