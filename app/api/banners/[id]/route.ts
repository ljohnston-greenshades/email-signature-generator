import { NextResponse } from "next/server";
import { isMarketingAuthed } from "@/lib/auth";
import { getBanner, saveBanner, deleteBanner } from "@/lib/banners";
import { buildTrackedUrl, withSignatureDefaults } from "@/lib/utm";

export const runtime = "nodejs";

// PATCH: update banner metadata / publish state (marketing only).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isMarketingAuthed())) {
    return NextResponse.json({ error: "Marketing login required." }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getBanner(id);
  if (!existing) return NextResponse.json({ error: "Banner not found." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const updated = { ...existing };
  if (typeof body.name === "string") updated.name = body.name.trim();
  if (typeof body.alt === "string") updated.alt = body.alt.trim();
  if (typeof body.published === "boolean") updated.published = body.published;
  if (typeof body.width === "number") updated.width = Math.min(600, Math.max(120, body.width));
  if (typeof body.destinationUrl === "string") updated.destinationUrl = body.destinationUrl.trim();
  if (body.utm && typeof body.utm === "object") {
    updated.utm = withSignatureDefaults(body.utm as Record<string, string>);
  }
  updated.trackedUrl = buildTrackedUrl(updated.destinationUrl, updated.utm);

  try {
    const saved = await saveBanner({ banner: updated });
    return NextResponse.json({ banner: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: remove a banner (marketing only).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isMarketingAuthed())) {
    return NextResponse.json({ error: "Marketing login required." }, { status: 401 });
  }
  const { id } = await params;
  try {
    await deleteBanner(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
