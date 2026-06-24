# Rendering & Deliverability Strategy

This document explains the technical choices behind how signatures are built, and
why they render consistently in Outlook.

## The core problem

Outlook is not one renderer — it's several:

| Client | Engine | Notes |
|---|---|---|
| Outlook 2016–2024 (Windows) | **Microsoft Word** | No SVG, no `<svg>`, no CSS fl/grid, no `data:` URI images, limited CSS. Honors tables + inline styles. |
| New Outlook for Windows / Outlook on the web | Chromium / browser | Modern, but still subject to "block external images". |
| Outlook for Mac | WebKit-ish | Generally good; copy-paste can inject junk. |
| Outlook mobile | WebView | Modern-ish. |

Two failure modes drive every decision below:

1. **SVG is unsupported** in classic Outlook (the Word engine). An `<svg>` or an
   SVG `<img>` simply does not draw.
2. **Hosted images can be blocked** ("Click to download pictures") in *received*
   mail.

## Why we do NOT use SVG

It's tempting to reach for SVG for a crisp, resolution-independent logo. But the
single most common Outlook client at a company like Greenshades is classic
Outlook for Windows, which cannot render SVG at all — the logo would vanish.
Inline `data:` URI images are also stripped by the Word engine, so base64
embedding is out too.

**Decision: PNG raster images + an HTML table with inline styles.** This is the
only combination that renders identically across every Outlook variant.

## Why the "blocked images" problem doesn't bite the signature

The "block external images" behavior applies to mail you *receive*. A signature
is different: when you paste the HTML into the Outlook **signature editor** (or
drop the `.htm` file into the Signatures folder), Outlook **downloads the logo
once and stores it locally** inside the signature definition. From then on the
image is a local resource embedded in every message you send, so recipients are
not relying on an external fetch for the brand mark.

To make this robust we also:

- Keep all **brand-critical text live** (name, title, tagline, links) as real
  HTML text — never baked into an image. If a recipient's client blocks the
  logo, the signature is still completely readable and on-brand.
- Use `alt` text on every image so a blocked image still communicates.
- Keep images small (logo 160px; banners ≤ 1.5 MB) for fast load and good
  deliverability (large/odd attachments hurt spam scores).

## Layout technique (the guardrails)

- **Tables, not divs.** Layout uses `<table>` with `cellpadding`/`cellspacing`/
  `border` attributes plus `border-collapse` — the only layout primitive Word
  honors reliably.
- **Inline styles only.** No `<style>` blocks or classes; Outlook discards much
  of `<head>` CSS, and pasting strips it anyway.
- **`display:block` spans, never `<p>`.** Paragraph tags inherit client default
  margins that "bleed" extra space when copied. Block spans give us exact
  spacing control. (Preserved from the CMO's original locked template.)
- **`mso-table-lspace/rspace:0`** to kill Word's phantom table gutters.
- **Explicit pixel widths** on images and the outer table so nothing reflows.

## Deliverability

- No external CSS, no scripts, no tracking pixels in the signature body.
- Banner click-through uses a normal `<a href>` with UTM query params — standard,
  analytics-friendly, and not a hidden tracker.
- Phone numbers render as `tel:` links; email as `mailto:` — both universally
  supported.

## Corrections applied vs. the original CMO skill

- **No "Web:" row.** The logo itself links to greenshades.com; a separate text
  website row was redundant.
- **LinkedIn shows polished text** — "Connect with me on LinkedIn" — linked to
  the profile, instead of exposing a raw `linkedin.com/in/...` URL.

## Two signatures

- **Full** — for new messages: name, title, contact details, linked logo,
  tagline, optional standard links, optional marketing banner.
- **Reply** — for replies/forwards: a compact name / title / "Greenshades" block
  so long threads don't accumulate giant signatures.
