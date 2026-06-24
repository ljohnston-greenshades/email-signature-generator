import { put, del, list } from "@vercel/blob";
import type { Banner } from "./types";

// ---------------------------------------------------------------------------
// Banner persistence on Vercel Blob.
//
// Images are stored as blobs; a single manifest.json (also a blob) holds the
// banner metadata array. This keeps the app database-free while still durable
// across serverless invocations.
//
// When BLOB_READ_WRITE_TOKEN is absent (e.g. before the Vercel Blob store is
// connected), every function degrades gracefully: reads return [] and writes
// throw a clear, catchable error rather than crashing the route.
// ---------------------------------------------------------------------------

const MANIFEST_PATH = "banners/manifest.json";

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export class BlobNotConfiguredError extends Error {
  constructor() {
    super(
      "Banner storage is not configured. Connect a Vercel Blob store and set BLOB_READ_WRITE_TOKEN."
    );
    this.name = "BlobNotConfiguredError";
  }
}

async function readManifest(): Promise<Banner[]> {
  if (!isBlobConfigured()) return [];
  try {
    // Find the current manifest blob (it has a stable pathname).
    const { blobs } = await list({ prefix: MANIFEST_PATH });
    const manifest = blobs.find((b) => b.pathname === MANIFEST_PATH);
    if (!manifest) return [];
    const res = await fetch(manifest.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as Banner[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeManifest(banners: Banner[]): Promise<void> {
  await put(MANIFEST_PATH, JSON.stringify(banners, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/** All banners (marketing view). */
export async function listAllBanners(): Promise<Banner[]> {
  const banners = await readManifest();
  return banners.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Only published banners (employee builder view). */
export async function listPublishedBanners(): Promise<Banner[]> {
  return (await listAllBanners()).filter((b) => b.published);
}

export async function getBanner(id: string): Promise<Banner | undefined> {
  return (await readManifest()).find((b) => b.id === id);
}

export interface SaveBannerInput {
  banner: Banner;
  /** Raw image bytes for a new upload, if any. */
  imageBytes?: ArrayBuffer;
  imageFilename?: string;
  imageContentType?: string;
}

export async function saveBanner(input: SaveBannerInput): Promise<Banner> {
  if (!isBlobConfigured()) throw new BlobNotConfiguredError();
  const banner = { ...input.banner };

  if (input.imageBytes) {
    const safeName = (input.imageFilename || "banner.png").replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploaded = await put(`banners/images/${banner.id}-${safeName}`, input.imageBytes, {
      access: "public",
      contentType: input.imageContentType || "image/png",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    banner.imageUrl = uploaded.url;
  }

  const banners = await readManifest();
  const idx = banners.findIndex((b) => b.id === banner.id);
  if (idx >= 0) banners[idx] = banner;
  else banners.push(banner);
  await writeManifest(banners);
  return banner;
}

export async function deleteBanner(id: string): Promise<void> {
  if (!isBlobConfigured()) throw new BlobNotConfiguredError();
  const banners = await readManifest();
  const target = banners.find((b) => b.id === id);
  const remaining = banners.filter((b) => b.id !== id);
  await writeManifest(remaining);
  if (target?.imageUrl) {
    try {
      await del(target.imageUrl);
    } catch {
      // Image already gone — manifest is the source of truth, ignore.
    }
  }
}
