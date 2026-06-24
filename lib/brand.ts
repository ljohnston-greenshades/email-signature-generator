// Greenshades brand constants — locked design tokens used across the signature
// templates. These are the guardrails: employees never change these values.

export const BRAND = {
  // Core palette (sourced from the CMO's locked template)
  navy: "#062a47",
  green: "#0a8944",
  charcoal: "#2f2f2f",
  hairline: "#eeeeee",
  pipe: "#bbbbbb",
  white: "#ffffff",

  tagline: "One platform. Every worker. No exceptions.",

  // The logo is hosted as a PNG. When pasted into the Outlook signature editor,
  // Outlook downloads and localizes the image, so the "block hosted images"
  // behavior that affects received mail does not affect the signature itself.
  // PNG (not SVG) is required — Outlook's Word rendering engine cannot draw SVG.
  logo: {
    src: "https://go.greenshades.com/hubfs/2026%20Branding%20Folder%20%5BLD%5D/GS%20Wordmark%20standard.png",
    href: "https://go.greenshades.com",
    width: 160,
    alt: "Greenshades",
  },

  // Fonts are locked. Georgia (serif) for the name, Arial for body contact rows.
  // The tagline uses a humanist sans stack: it prefers Source Sans Pro (the
  // Greenshades brand face) and degrades to the closest widely-installed
  // humanist sans-serifs — Segoe UI on Windows/Outlook, then system fallbacks.
  // Email clients can't load web fonts, so this stack is what guarantees a
  // close visual match across Outlook variants without relying on @font-face.
  fonts: {
    serif: "Georgia,serif",
    sans: "Arial,sans-serif",
    humanist:
      "'Source Sans Pro','Source Sans 3','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif",
  },
} as const;

// Standard, brand-approved link options shown below the logo. Text + URLs for
// A/B/C are fully locked. D's text is locked; the employee supplies the URL.
export type StandardLinkId = "support" | "ticket" | "login" | "meeting";

export interface StandardLinkDef {
  id: StandardLinkId;
  text: string;
  url?: string; // undefined => employee must provide (option D)
  requiresUrl?: boolean;
  helper?: string;
}

export const STANDARD_LINKS: StandardLinkDef[] = [
  {
    id: "support",
    text: "Visit our Support Center",
    url: "https://support.greenshadesonline.com",
  },
  {
    id: "ticket",
    text: "Submit a Ticket",
    url: "https://support.greenshadesonline.com/SignIn?returnUrl=%2F",
  },
  {
    id: "login",
    text: "Log In to Greenshades",
    url: "https://www.greenshadesonline.com/SSO/admin/default.aspx",
  },
  {
    id: "meeting",
    text: "Schedule a Meeting",
    requiresUrl: true,
    helper: "Paste your personal Calendly or HubSpot scheduling link",
  },
];

export const LINKEDIN_DISPLAY_TEXT = "Connect with me on LinkedIn";
