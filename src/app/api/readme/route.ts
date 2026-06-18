import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const filePath = join(process.cwd(), 'README.md');
  const content = readFileSync(filePath, 'utf-8');
  return NextResponse.json({ content });
}
