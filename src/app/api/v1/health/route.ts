export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "fisclens-togo-api",
    timestamp: new Date().toISOString(),
  });
}
