// HubSpot directory lookup.
//
// Given an employee's email, prefill the signature builder with name, job title,
// and phone as an editable starting point.
//
// Auth: a HubSpot token in env HUBSPOT_TOKEN, used as a Bearer token. This works
// with either a Private App access token OR a Personal Access Key (PAK) — both
// authenticate the same REST endpoints based on their selected scopes.
//
// Because tokens differ in which scopes they carry, the lookup tries multiple
// sources and merges what it can get:
//   1. `users` object search   — richest (name, title, phone); needs
//                                 crm.objects.users.read
//   2. Owners API              — name + email for every HubSpot seat; needs
//                                 crm.objects.owners.read
//   3. `contacts` search       — enriches title/phone if the employee also has a
//                                 contact record; needs crm.objects.contacts.read
//
// Each source fails soft (a missing scope / 403 just yields nothing), so the
// feature works with whatever scopes the configured token happens to have.

const API_BASE = "https://api.hubapi.com";

export const ALLOWED_EMAIL_DOMAIN = (
  process.env.ALLOWED_EMAIL_DOMAIN || "greenshades.com"
).toLowerCase();

export interface EmployeeLookupResult {
  found: boolean;
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
}

export function isHubSpotConfigured(): boolean {
  return Boolean(process.env.HUBSPOT_TOKEN);
}

export function isInternalEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  return email.slice(at + 1).toLowerCase() === ALLOWED_EMAIL_DOMAIN;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

type Partial = { name?: string; title?: string; phone?: string; email?: string };

// 1. CRM `users` object — best source (has title + phone). Needs users.read.
async function fromUsers(token: string, email: string): Promise<Partial | null> {
  try {
    const res = await fetch(`${API_BASE}/crm/v3/objects/users/search`, {
      method: "POST",
      headers: authHeaders(token),
      cache: "no-store",
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: "hs_email", operator: "EQ", value: email }] }],
        properties: ["hs_given_name", "hs_family_name", "hs_job_title", "hs_main_phone", "hs_email"],
        limit: 1,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: Array<{ properties?: Record<string, string | null> }> };
    const p = data.results?.[0]?.properties;
    if (!p) return null;
    return {
      name: [p.hs_given_name, p.hs_family_name].filter(Boolean).join(" ").trim() || undefined,
      title: p.hs_job_title?.trim() || undefined,
      phone: p.hs_main_phone?.trim() || undefined,
      email: p.hs_email?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

// 2. Owners API — name + email for every HubSpot seat. Needs owners.read.
async function fromOwners(token: string, email: string): Promise<Partial | null> {
  try {
    const res = await fetch(`${API_BASE}/crm/v3/owners/?email=${encodeURIComponent(email)}&limit=1`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ firstName?: string; lastName?: string; email?: string }>;
    };
    const o = data.results?.[0];
    if (!o) return null;
    return {
      name: [o.firstName, o.lastName].filter(Boolean).join(" ").trim() || undefined,
      email: o.email?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

// 3. Contacts search — enrich title/phone if the employee has a contact record.
async function fromContacts(token: string, email: string): Promise<Partial | null> {
  try {
    const res = await fetch(`${API_BASE}/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers: authHeaders(token),
      cache: "no-store",
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
        properties: ["firstname", "lastname", "jobtitle", "phone", "mobilephone", "email"],
        limit: 1,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: Array<{ properties?: Record<string, string | null> }> };
    const p = data.results?.[0]?.properties;
    if (!p) return null;
    return {
      name: [p.firstname, p.lastname].filter(Boolean).join(" ").trim() || undefined,
      title: p.jobtitle?.trim() || undefined,
      phone: p.phone?.trim() || p.mobilephone?.trim() || undefined,
      email: p.email?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

// Merge sources, keeping the first non-empty value for each field (sources are
// passed most-authoritative first).
function merge(...parts: Array<Partial | null>): Partial {
  const out: Partial = {};
  for (const part of parts) {
    if (!part) continue;
    out.name ??= part.name;
    out.title ??= part.title;
    out.phone ??= part.phone;
    out.email ??= part.email;
  }
  return out;
}

export async function lookupEmployee(emailRaw: string): Promise<EmployeeLookupResult> {
  const email = emailRaw.trim().toLowerCase();
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) return { found: false };
  if (!isInternalEmail(email)) return { found: false };

  // Run the three sources in parallel; each fails soft to null.
  const [users, owners, contacts] = await Promise.all([
    fromUsers(token, email),
    fromOwners(token, email),
    fromContacts(token, email),
  ]);

  // Prefer users (title+phone), then owners (authoritative name), then contacts.
  const merged = merge(users, owners, contacts);
  const found = Boolean(merged.name || merged.email);

  return {
    found,
    name: merged.name,
    title: merged.title,
    phone: merged.phone,
    email: merged.email || (found ? email : undefined),
  };
}
