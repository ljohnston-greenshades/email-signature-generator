import { NextResponse } from "next/server";
import { isMarketingAuthed, isAuthConfigured } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    authed: await isMarketingAuthed(),
    configured: isAuthConfigured(),
  });
}
