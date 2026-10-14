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

// Greenshades' toll-free support line. Used by the "toll-free number" checkbox
// (as the direct line) and by the "support phone" standard link.
export const SUPPORT_PHONE = "888-255-3815";

// Standard, brand-approved options shown below the logo. Text + URLs for the
// login / support / phone options are fully locked. The meeting option's text is
// locked; the employee supplies the URL. Login, support and phone render in this
// order on one pipe-separated line; the meeting option is a button underneath.
export type StandardLinkId = "login" | "support" | "phone" | "meeting";

export interface StandardLinkDef {
  id: StandardLinkId;
  /** Text as it appears in the signature. */
  text: string;
  /** Checkbox label in the builder, when different from `text`. */
  optionLabel?: string;
  url?: string; // undefined => employee must provide (meeting)
  /** Renders as a tel: link to SUPPORT_PHONE instead of a URL. */
  isPhone?: boolean;
  requiresUrl?: boolean;
  helper?: string;
}

export const STANDARD_LINKS: StandardLinkDef[] = [
  {
    id: "login",
    text: "Log in",
    optionLabel: "Log in to Greenshades",
    url: "https://www.greenshadesonline.com/SSO/admin/default.aspx",
  },
  {
    id: "support",
    text: "Support portal",
    optionLabel: "Visit our support portal",
    url: "https://support.greenshadesonline.com/SignIn?returnUrl=%2F",
  },
  {
    id: "phone",
    text: "(888) 255-3815",
    optionLabel: "Call support",
    isPhone: true,
    helper: "Greenshades' toll-free support number, (888) 255-3815",
  },
  {
    id: "meeting",
    text: "Schedule a meeting",
    requiresUrl: true,
    helper: "Paste your personal Calendly or HubSpot scheduling link",
  },
];

export const LINKEDIN_DISPLAY_TEXT = "Connect on LinkedIn";
