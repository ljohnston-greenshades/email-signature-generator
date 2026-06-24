import { NextResponse } from "next/server";
import crypto from "crypto";
import { isMarketingAuthed } from "@/lib/auth";
import {
  listAllBanners,
  listPublishedBanners,
  saveBanner,
  isBlobConfigured,
} from "@/lib/banners";
import { buildTrackedUrl, withSignatureDefaults } from "@/lib/utm";
import type { Banner } from "@/lib/types";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB — keeps signatures lightweight
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif"];

// GET: published banners for everyone; the full set for authed marketing.
export async function GET() {
  const authed = await isMarketingAuthed();
  const banners = authed ? await listAllBanners() : await listPublishedBanners();
  return NextResponse.json({ banners, blobConfigured: isBlobConfigured() });
}

// POST: create a banner (marketing only). multipart/form-data with an image file.
export async function POST(request: Request) {
  if (!(await isMarketingAuthed())) {
    return NextResponse.json({ error: "Marketing login required." }, { status: 401 });
  }
  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Banner storage is not configured. Connect a Vercel Blob store." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = form.get("image");
  const name = String(form.get("name") || "").trim();
  const destinationUrl = String(form.get("destinationUrl") || "").trim();
  const alt = String(form.get("alt") || name || "Greenshades").trim();
  const width = Math.min(600, Math.max(120, Number(form.get("width")) || 460));
  // Unchecked checkboxes are absent from FormData, so treat "true" presence as published.
  const published = form.getAll("published").includes("true");

  const utm = withSignatureDefaults({
    source: String(form.get("utm_source") || ""),
    medium: String(form.get("utm_medium") || ""),
    campaign: String(form.get("utm_campaign") || ""),
    term: String(form.get("utm_term") || ""),
    content: String(form.get("utm_content") || ""),
  });

  if (!name) return NextResponse.json({ error: "Banner name is required." }, { status: 400 });
  if (!destinationUrl) {
    return NextResponse.json({ error: "Destination URL is required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Image must be PNG, JPEG, or GIF (Outlook cannot render SVG)." },
      { status: 400 }
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be under 1.5 MB." }, { status: 400 });
  }

  let trackedUrl: string;
  try {
    trackedUrl = buildTrackedUrl(destinationUrl, utm);
  } catch {
    return NextResponse.json({ error: "Destination URL is invalid." }, { status: 400 });
  }

  const banner: Banner = {
    id: crypto.randomUUID(),
    name,
    imageUrl: "",
    width,
    alt,
    destinationUrl,
    utm,
    trackedUrl,
    published,
    createdAt: new Date().toISOString(),
    createdBy: "marketing",
  };

  try {
    const saved = await saveBanner({
      banner,
      imageBytes: await file.arrayBuffer(),
      imageFilename: file.name,
      imageContentType: file.type,
    });
    return NextResponse.json({ banner: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
