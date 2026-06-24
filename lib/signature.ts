import { BRAND, STANDARD_LINKS, LINKEDIN_DISPLAY_TEXT } from "./brand";
import type { Banner, SignatureConfig } from "./types";

// ---------------------------------------------------------------------------
// Escaping helpers — every employee-supplied value is escaped before it lands
// in the signature markup, so a stray "&", quote, or "<" can never break the
// table layout (or inject markup) when the HTML is copied into Outlook.
// ---------------------------------------------------------------------------

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape a URL for safe use in an href attribute; reject unsafe schemes. */
export function safeUrl(value: string): string {
  const trimmed = value.trim();
  if (/^\s*javascript:/i.test(trimmed) || /^\s*data:/i.test(trimmed)) {
    return "#";
  }
  return escapeHtml(trimmed);
}

// ---------------------------------------------------------------------------
// Phone normalization → display "(XXX) XXX-XXXX", href "+1XXXXXXXXXX".
// ---------------------------------------------------------------------------

export function normalizePhone(raw: string): { display: string; href: string } | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  let national = digits;
  let countryPrefix = "+1";
  if (digits.length === 11 && digits.startsWith("1")) {
    national = digits.slice(1);
  } else if (digits.length > 11) {
    // International or with extension — keep digits but don't force US format.
    return { display: raw.trim(), href: `+${digits}` };
  }

  if (national.length === 10) {
    const area = national.slice(0, 3);
    const mid = national.slice(3, 6);
    const last = national.slice(6);
    return { display: `(${area}) ${mid}-${last}`, href: `${countryPrefix}${national}` };
  }

  // Fallback: not a clean 10-digit US number — show what they typed.
  return { display: raw.trim(), href: `+${digits}` };
}

// ---------------------------------------------------------------------------
// Row builders. Each returns inline-styled <tr> markup or "" when omitted.
// Text elements use display:block spans (never <p>) so browser/Outlook default
// margins can't bleed through on copy — preserved from the CMO's locked design.
// ---------------------------------------------------------------------------

function labeledRow(label: string, href: string, display: string): string {
  return `<tr><td style="padding:0 0 1px 0;font-family:${BRAND.fonts.sans};font-size:13px;color:${BRAND.navy};line-height:1.3;"><span style="font-weight:bold;color:${BRAND.navy};">${label}</span>&nbsp;&nbsp;<a href="${href}" style="color:${BRAND.charcoal};text-decoration:none;">${display}</a></td></tr>`;
}

function emailRow(email?: string): string {
  if (!email?.trim()) return "";
  const safe = escapeHtml(email.trim());
  return labeledRow("Email:", `mailto:${safe}`, safe);
}

function phoneRow(phone?: string): string {
  if (!phone?.trim()) return "";
  const normalized = normalizePhone(phone);
  if (!normalized) return "";
  return labeledRow("Phone:", `tel:${escapeHtml(normalized.href)}`, escapeHtml(normalized.display));
}

/**
 * LinkedIn — CORRECTION from the CMO skill: we never render a raw LinkedIn URL.
 * Instead we show polished, clickable text ("Connect with me on LinkedIn").
 */
function linkedInRow(include: boolean, url?: string): string {
  if (!include || !url?.trim()) return "";
  return `<tr><td style="padding:0 0 1px 0;font-family:${BRAND.fonts.sans};font-size:13px;line-height:1.3;"><a href="${safeUrl(url)}" style="color:${BRAND.navy};text-decoration:none;font-weight:bold;">${LINKEDIN_DISPLAY_TEXT}</a></td></tr>`;
}

function logoRow(): string {
  const { logo } = BRAND;
  return `<tr><td style="padding:0 0 5px 0;"><a href="${logo.href}" target="_blank" style="text-decoration:none;display:block;"><img src="${logo.src}" alt="${logo.alt}" width="${logo.width}" border="0" style="display:block;width:${logo.width}px;height:auto;max-width:${logo.width}px;"></a></td></tr>`;
}

function taglineRow(): string {
  return `<tr><td style="padding:3px 0 0 0;font-family:${BRAND.fonts.serif};font-size:11px;font-style:italic;color:${BRAND.green};line-height:1.4;">${BRAND.tagline}</td></tr>`;
}

function linksBlock(config: SignatureConfig): string {
  const parts: string[] = [];
  for (const id of config.links) {
    const def = STANDARD_LINKS.find((l) => l.id === id);
    if (!def) continue;
    const url = def.requiresUrl ? config.meetingUrl : def.url;
    if (!url?.trim()) continue; // option D with no URL → skip
    parts.push(
      `<a href="${safeUrl(url)}" style="color:${BRAND.navy};text-decoration:underline;">${escapeHtml(def.text)}</a>`
    );
  }
  if (parts.length === 0) return "";
  const separator = `<span style="color:${BRAND.pipe};margin:0 8px;">|</span>`;
  const content = parts.join(separator);
  return `<tr><td style="padding:10px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" width="460" style="border-collapse:collapse;"><tr><td width="460" height="1" bgcolor="${BRAND.hairline}" style="font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr><tr><td style="padding:10px 0 0 0;font-family:${BRAND.fonts.sans};font-size:13px;line-height:1.3;">${content}</td></tr>`;
}

function bannerRow(banner?: Banner): string {
  if (!banner) return "";
  return `<tr><td style="padding:14px 0 0 0;"><a href="${safeUrl(banner.trackedUrl)}" target="_blank" style="text-decoration:none;display:block;"><img src="${escapeHtml(banner.imageUrl)}" alt="${escapeHtml(banner.alt)}" width="${banner.width}" border="0" style="display:block;width:${banner.width}px;height:auto;max-width:${banner.width}px;"></a></td></tr>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RenderOptions {
  banner?: Banner;
}

/** Full signature for New Messages. */
export function renderFullSignature(config: SignatureConfig, opts: RenderOptions = {}): string {
  const name = escapeHtml(config.name.trim());
  const title = escapeHtml(config.title.trim());

  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>` +
    `<body style="margin:0;padding:0;background:${BRAND.white};">` +
    `<table cellpadding="0" cellspacing="0" border="0" width="460" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">` +
    `<tr><td style="padding:0 0 1px 0;"><span style="display:block;font-family:${BRAND.fonts.serif};font-size:17px;font-weight:bold;color:${BRAND.navy};line-height:1.3;">${name}</span></td></tr>` +
    `<tr><td style="padding:0 0 11px 0;"><span style="display:block;font-family:${BRAND.fonts.sans};font-size:12px;font-weight:normal;color:${BRAND.charcoal};line-height:1.4;">${title}</span></td></tr>` +
    emailRow(config.email) +
    phoneRow(config.phone) +
    linkedInRow(config.includeLinkedIn, config.linkedInUrl) +
    // CORRECTION: the "Web:" row is removed — the linked logo IS the website link.
    // Spacer between contact details and the logo block.
    `<tr><td style="padding:0 0 11px 0;font-size:0;line-height:0;">&nbsp;</td></tr>` +
    logoRow() +
    taglineRow() +
    linksBlock(config) +
    bannerRow(opts.banner) +
    `</table></body></html>`
  );
}

/** Compact signature for Replies & Forwards. */
export function renderReplySignature(config: SignatureConfig): string {
  const name = escapeHtml(config.name.trim());
  const title = escapeHtml(config.title.trim());
  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>` +
    `<body style="margin:0;padding:0;background:${BRAND.white};">` +
    `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">` +
    `<tr><td style="padding:0 0 1px 0;"><span style="display:block;font-family:${BRAND.fonts.sans};font-size:14px;font-weight:bold;color:${BRAND.navy};">${name}</span></td></tr>` +
    `<tr><td style="padding:0 0 1px 0;"><span style="display:block;font-family:${BRAND.fonts.sans};font-size:12px;font-weight:normal;color:${BRAND.charcoal};">${title}</span></td></tr>` +
    `<tr><td style="padding:0;"><span style="display:block;font-family:${BRAND.fonts.sans};font-size:12px;font-weight:normal;color:${BRAND.navy};">Greenshades</span></td></tr>` +
    `</table></body></html>`
  );
}
