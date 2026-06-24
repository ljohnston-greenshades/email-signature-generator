// UTM helpers for marketing banners. Marketing supplies a destination URL plus
// UTM parameters; we compose a clean, deterministic tracking URL.

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

const UTM_KEYS: Array<[keyof UtmParams, string]> = [
  ["source", "utm_source"],
  ["medium", "utm_medium"],
  ["campaign", "utm_campaign"],
  ["term", "utm_term"],
  ["content", "utm_content"],
];

/**
 * Build a destination URL with UTM parameters appended. Existing query params on
 * the base URL are preserved; UTM keys already present are overwritten with the
 * supplied values so the manifest stays the single source of truth.
 */
export function buildTrackedUrl(destination: string, utm: UtmParams): string {
  let url: URL;
  try {
    url = new URL(destination);
  } catch {
    // Tolerate a bare domain ("greenshades.com") by assuming https.
    url = new URL(`https://${destination}`);
  }
  for (const [key, param] of UTM_KEYS) {
    const value = utm[key]?.trim();
    if (value) {
      url.searchParams.set(param, value);
    }
  }
  return url.toString();
}

/** A default email-medium UTM set so signature clicks are always attributable. */
export function withSignatureDefaults(utm: UtmParams): UtmParams {
  return {
    source: utm.source?.trim() || "email_signature",
    medium: utm.medium?.trim() || "email",
    campaign: utm.campaign?.trim() || undefined,
    term: utm.term?.trim() || undefined,
    content: utm.content?.trim() || undefined,
  };
}
