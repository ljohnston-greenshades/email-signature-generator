// HubSpot directory lookup.
//
// Greenshades employees are HubSpot *users*, and the CRM `users` object exposes
// first name, last name, job title, main phone, and email. Given just an email,
// we can prefill the signature builder with a sensible starting point that the
// employee then reviews and edits.
//
// This runs server-side with a HubSpot Private App token (env HUBSPOT_TOKEN)
// scoped to `crm.objects.users.read`. When the token is absent the feature is
// disabled and the builder behaves exactly as before.

const HUBSPOT_SEARCH_URL = "https://api.hubapi.com/crm/v3/objects/users/search";

// Only internal addresses are looked up — this is an employee-directory prefill,
// never a way to pull external contact PII. Configurable via env.
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

export async function lookupEmployee(emailRaw: string): Promise<EmployeeLookupResult> {
  const email = emailRaw.trim().toLowerCase();
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) return { found: false };
  if (!isInternalEmail(email)) return { found: false };

  const res = await fetch(HUBSPOT_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "hs_email", operator: "EQ", value: email }] }],
      properties: ["hs_given_name", "hs_family_name", "hs_job_title", "hs_main_phone", "hs_email"],
      limit: 1,
    }),
  });

  if (!res.ok) {
    // Don't leak HubSpot internals to the client; treat as "not found".
    return { found: false };
  }

  const data = (await res.json()) as {
    results?: Array<{ properties?: Record<string, string | null> }>;
  };
  const props = data.results?.[0]?.properties;
  if (!props) return { found: false };

  const name = [props.hs_given_name, props.hs_family_name].filter(Boolean).join(" ").trim();

  return {
    found: true,
    name: name || undefined,
    title: props.hs_job_title?.trim() || undefined,
    phone: props.hs_main_phone?.trim() || undefined,
    email: props.hs_email?.trim() || email,
  };
}
