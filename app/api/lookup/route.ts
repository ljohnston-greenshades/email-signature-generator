import { NextResponse } from "next/server";
import { lookupEmployee, isHubSpotConfigured, isInternalEmail, ALLOWED_EMAIL_DOMAIN } from "@/lib/hubspot";

export const runtime = "nodejs";

// GET (no params): lets the builder decide whether to show the prefill box.
export async function GET() {
  return NextResponse.json({ configured: isHubSpotConfigured(), domain: ALLOWED_EMAIL_DOMAIN });
}

// POST { email }: look up an employee's directory details for prefill.
export async function POST(request: Request) {
  if (!isHubSpotConfigured()) {
    return NextResponse.json({ configured: false, found: false });
  }

  let email = "";
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!isInternalEmail(email)) {
    return NextResponse.json(
      { found: false, error: `Enter your @${ALLOWED_EMAIL_DOMAIN} email.` },
      { status: 400 }
    );
  }

  try {
    const result = await lookupEmployee(email);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ found: false });
  }
}
