import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const res = await fetch(`${process.env.API_URL}/api/search?q=${encodeURIComponent(q)}`, {
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data);
}
