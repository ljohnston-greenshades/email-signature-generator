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

// A single, understated contact line: the phone number and a small on-brand
// LinkedIn "in" badge share one row, vertically centered. No "Phone:" label and
// no floating link text — the badge is an instantly-recognizable icon built
// from a table cell (no image; renders in every Outlook).
function linkedInBadge(href: string): string {
  return (
    `<td valign="middle" width="18" align="center" bgcolor="${BRAND.navy}" ` +
    `style="background:${BRAND.navy};border-radius:4px;width:18px;height:18px;text-align:center;vertical-align:middle;">` +
    `<a href="${safeUrl(href)}" target="_blank" title="${LINKEDIN_DISPLAY_TEXT}" ` +
    `style="color:#ffffff;text-decoration:none;font-family:${BRAND.fonts.sans};font-size:11px;font-weight:bold;line-height:18px;display:block;">in</a></td>`
  );
}

function contactLine(config: SignatureConfig): string {
  const cells: string[] = [];
  const gap = (w: number) => `<td width="${w}" style="width:${w}px;font-size:0;line-height:0;">&nbsp;</td>`;
  const textStyle = `font-family:${BRAND.fonts.sans};font-size:13px;line-height:18px;color:${BRAND.navy};`;

  const phone = config.phone?.trim() ? normalizePhone(config.phone) : null;
  const liHref = config.includeLinkedIn ? normalizeLinkedIn(config.linkedInUrl || "") : "";

  if (phone) {
    cells.push(
      `<td valign="middle" style="${textStyle}"><a href="tel:${escapeHtml(phone.href)}" style="color:${BRAND.navy};text-decoration:none;">${escapeHtml(phone.display)}</a></td>`
    );
  }

  if (liHref) {
    if (!phone) {
      // No phone: label the badge "Connect with me", snug against the icon.
      cells.push(
        `<td valign="middle" style="${textStyle}"><a href="${safeUrl(liHref)}" style="color:${BRAND.navy};text-decoration:none;">Connect with me</a></td>`
      );
      cells.push(gap(6));
    } else {
      // Phone present: unchanged spacing between the number and the badge.
      cells.push(gap(12));
    }
    cells.push(linkedInBadge(liHref));
  }

  if (cells.length === 0) return "";
  return (
    `<tr><td style="padding:3px 0 1px 0;">` +
    `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr>${cells.join("")}</tr></table>` +
    `</td></tr>`
  );
}

/**
 * Normalize whatever the employee pastes into a clean LinkedIn profile URL.
 * Accepts a full URL, a bare "linkedin.com/in/handle", "in/handle", or just
 * "handle". Returns "" if there's nothing usable.
 */
export function normalizeLinkedIn(input: string): string {
  let v = input.trim();
  if (!v) return "";
  // Already a full URL → leave the scheme/host intact.
  if (/^https?:\/\//i.test(v)) return v;
  // Starts at the domain → just add the scheme.
  if (/^(www\.)?linkedin\.com\//i.test(v)) return `https://${v.replace(/^www\./i, "www.")}`;
  // Otherwise treat it as a handle, tolerating a leading "in/" or slashes.
  const handle = v.replace(/^\/?(in\/)?/i, "").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!handle) return "";
  return `https://www.linkedin.com/in/${handle}`;
}

function logoRow(): string {
  const { logo } = BRAND;
  return (
    `<tr><td style="padding:0 0 5px 0;"><a href="${safeUrl(logo.href)}" target="_blank" style="text-decoration:none;display:block;">` +
    `<img src="${logo.src}" alt="${logo.alt}" width="${logo.width}" border="0" style="display:block;width:${logo.width}px;height:auto;max-width:${logo.width}px;">` +
    `</a></td></tr>`
  );
}

function taglineRow(): string {
  return `<tr><td style="padding:3px 0 0 0;font-family:${BRAND.fonts.humanist};font-size:12px;font-weight:normal;color:${BRAND.green};line-height:1.4;letter-spacing:0.2px;">${BRAND.tagline}</td></tr>`;
}

function linksBlock(config: SignatureConfig): string {
  // Standard links render as inline, pipe-separated text. The "Schedule a
  // meeting" option (D) is promoted to a standout green CTA button instead.
  const inlineParts: string[] = [];
  let meetingButton = "";

  for (const id of config.links) {
    const def = STANDARD_LINKS.find((l) => l.id === id);
    if (!def) continue;
    if (def.requiresUrl) {
      const url = config.meetingUrl;
      if (!url?.trim()) continue; // option D with no URL → skip
      // Outlook-safe button: a <td> with bgcolor + padding (border-radius is
      // honored everywhere except classic Outlook, which shows a clean square).
      meetingButton =
        `<tr><td style="padding:12px 0 0 0;">` +
        `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">` +
        `<tr><td bgcolor="${BRAND.green}" style="background:${BRAND.green};border-radius:5px;padding:9px 18px;">` +
        `<a href="${safeUrl(url)}" target="_blank" style="color:#ffffff;text-decoration:none;font-family:${BRAND.fonts.sans};font-size:13px;font-weight:bold;line-height:1;display:inline-block;">${escapeHtml(def.text)}</a>` +
        `</td></tr></table></td></tr>`;
    } else {
      if (!def.url?.trim()) continue;
      inlineParts.push(
        `<a href="${safeUrl(def.url)}" style="color:${BRAND.navy};text-decoration:underline;">${escapeHtml(def.text)}</a>`
      );
    }
  }

  if (inlineParts.length === 0 && !meetingButton) return "";

  const hairline =
    `<tr><td style="padding:10px 0 0 0;"><table cellpadding="0" cellspacing="0" border="0" width="460" style="border-collapse:collapse;"><tr><td width="460" height="1" bgcolor="${BRAND.hairline}" style="font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr>`;
  const separator = `<span style="color:${BRAND.pipe};margin:0 8px;">|</span>`;
  const inlineRow = inlineParts.length
    ? `<tr><td style="padding:10px 0 0 0;font-family:${BRAND.fonts.sans};font-size:13px;line-height:1.3;">${inlineParts.join(separator)}</td></tr>`
    : "";

  return hairline + inlineRow + meetingButton;
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
    `<tr><td style="padding:0 0 1px 0;"><span style="display:block;font-family:${BRAND.fonts.sans};font-size:12px;font-weight:normal;color:${BRAND.charcoal};line-height:1.4;">${title}</span></td></tr>` +
    contactLine(config) +
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

/** Compact signature for Replies & Forwards. "" when the style is "none". */
export function renderReplySignature(config: SignatureConfig): string {
  const style = config.replyStyle ?? "compact";
  if (style === "none") return "";

  const name = escapeHtml(config.name.trim());
  const title = escapeHtml(config.title.trim());
  // "minimal" drops the title line, leaving name + company only.
  const titleRow =
    style === "compact" && title
      ? `<tr><td style="padding:0 0 1px 0;"><span style="display:block;font-family:${BRAND.fonts.sans};font-size:12px;font-weight:normal;color:${BRAND.charcoal};">${title}</span></td></tr>`
      : "";

  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>` +
    `<body style="margin:0;padding:0;background:${BRAND.white};">` +
    `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">` +
    `<tr><td style="padding:0 0 1px 0;"><span style="display:block;font-family:${BRAND.fonts.sans};font-size:14px;font-weight:bold;color:${BRAND.navy};">${name}</span></td></tr>` +
    titleRow +
    `<tr><td style="padding:0;"><span style="display:block;font-family:${BRAND.fonts.sans};font-size:12px;font-weight:normal;color:${BRAND.navy};">Greenshades</span></td></tr>` +
    `</table></body></html>`
  );
}
