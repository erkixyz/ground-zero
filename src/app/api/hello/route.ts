import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Tere! API töötab.",
    timestamp: new Date().toISOString(),
    status: "ok",
  });
}
