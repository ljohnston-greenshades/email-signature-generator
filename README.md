# Greenshades Email Signature Builder

A Next.js app that lets any Greenshades employee build a personalized,
brand-compliant email signature for Outlook — with guardrails so the design stays
on-brand — and lets the Marketing team manage UTM-tracked campaign banners.

This app is the productized version of the CMO's "greenshades-email-signature"
Claude skill, with two corrections baked in (no website row — the logo is the
link; LinkedIn shows polished text, not a raw URL).

## What it does

- **Employees (no login):** fill in name, title, and optional email, phone,
  LinkedIn, standard links, and a marketing banner. Get a live preview, copy to
  clipboard, or download `.htm` files for Outlook — plus install instructions.
- **Marketing (login required):** upload banners, tag them with UTM parameters,
  publish/unpublish, and delete. Published banners appear in the builder for all
  employees.

The signature itself is table-based, inline-styled HTML using PNG images (never
SVG) so it renders consistently across every Outlook variant. See
[`docs/RENDERING.md`](docs/RENDERING.md) for the full rationale.

## Tech

- Next.js (App Router) + React + TypeScript
- Plain CSS (no UI framework) for fast, dependency-light builds
- Vercel Blob for banner image + manifest storage
- Cookie-based marketing auth (HMAC-signed, httpOnly)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the builder and `/marketing` for the banner
manager.

## Environment variables

Set these in Vercel (Project → Settings → Environment Variables):

| Variable | Required for | Description |
|---|---|---|
| `MARKETING_PASSWORD` | Marketing login | Shared password for the Marketing team. Without it, the builder still works for everyone; only banner management is disabled. |
| `AUTH_SECRET` | Session signing | Random string used to sign the session cookie. Defaults to `MARKETING_PASSWORD` if unset, but set a separate value in production. |
| `BLOB_READ_WRITE_TOKEN` | Banner storage | Set automatically when you connect a Vercel Blob store (Storage → Create → Blob). Without it, the builder works but banner uploads are disabled. |

The app **degrades gracefully** when these are missing: employees can always
build signatures; only the marketing features require configuration.

## Deploying on Vercel

1. Import the GitHub repo into Vercel (framework auto-detected as Next.js).
2. Add a **Blob** store (Storage → Create → Blob) — this sets
   `BLOB_READ_WRITE_TOKEN`.
3. Add `MARKETING_PASSWORD` and `AUTH_SECRET` env vars.
4. Production deploys from the `main` branch.

## Upgrading authentication to SSO

Greenshades runs on Microsoft 365. To move from the shared password to per-user
SSO, replace the password check in [`lib/auth.ts`](lib/auth.ts) with an Entra ID
(Azure AD) OpenID Connect flow and gate banner management on a "Marketing" group
claim. The route handlers and the `isMarketingAuthed()` contract stay the same.

## Project layout

```
app/
  page.tsx              Builder (public)
  marketing/page.tsx    Marketing login + banner manager
  api/auth/*            Login / logout / session
  api/banners/*         List / create / update / delete banners
lib/
  brand.ts              Locked brand tokens + standard link options
  signature.ts          Signature HTML generator (the guardrails live here)
  utm.ts                UTM URL composition
  banners.ts            Vercel Blob persistence
  auth.ts               Marketing session auth
components/             Preview, banner picker, install instructions
docs/RENDERING.md       Outlook rendering & deliverability strategy
```
