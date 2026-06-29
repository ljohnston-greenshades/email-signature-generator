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

  // Single logo that works on both light and dark email backgrounds (dark
  // wordmark with a faint white outline), so no dark-mode swap is needed.
  // When pasted into Outlook, the hosted PNG is downloaded and localized.
  // PNG (not SVG) is required — Outlook's Word engine cannot draw SVG.
  logo: {
    src: "https://go.greenshades.com/hubfs/2026%20Branding%20Folder%20%5BLD%5D/GS%20Wordmark%20email.png",
    // The logo links to greenshades.com with hard-coded UTM tracking so every
    // signature's logo click is attributable. Conventions match the banner UTM
    // builder (source=email_signature, medium=email); content=signature_logo
    // distinguishes a logo click from a banner click (content=signature_banner).
    href:
      "https://go.greenshades.com/?utm_source=email_signature&utm_medium=email&utm_campaign=employee_signature&utm_content=signature_logo",
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
export type StandardLinkId = "support" | "login" | "meeting";

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
    text: "Visit our support portal",
    url: "https://support.greenshadesonline.com/SignIn?returnUrl=%2F",
  },
  {
    id: "login",
    text: "Log In to Greenshades",
    url: "https://www.greenshadesonline.com/SSO/admin/default.aspx",
  },
  {
    id: "meeting",
    text: "Schedule a meeting",
    requiresUrl: true,
    helper: "Paste your personal Calendly or HubSpot scheduling link",
  },
];

export const LINKEDIN_DISPLAY_TEXT = "Connect on LinkedIn";
