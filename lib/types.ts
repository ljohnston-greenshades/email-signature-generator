import type { UtmParams } from "./utm";
import type { StandardLinkId } from "./brand";

export interface Banner {
  id: string;
  /** Human-friendly name shown in the picker (e.g. "Q2 Webinar"). */
  name: string;
  /** Hosted PNG/JPG URL (Vercel Blob). */
  imageUrl: string;
  /** Displayed/rendered width in px. Height auto-scales. */
  width: number;
  /** Alt text for accessibility + when images are blocked. */
  alt: string;
  /** Where the banner click goes, before UTM is applied. */
  destinationUrl: string;
  utm: UtmParams;
  /** destinationUrl + composed UTM params. Precomputed for the builder. */
  trackedUrl: string;
  /** Whether the banner is visible to all employees in the builder. */
  published: boolean;
  createdAt: string;
  createdBy: string;
}

export interface SignatureConfig {
  name: string;
  title: string;
  email?: string;
  phone?: string; // raw digits or formatted; normalized at render time
  includeLinkedIn: boolean;
  linkedInUrl?: string;
  /** Selected standard link ids, in display order. */
  links: StandardLinkId[];
  /** URL for the "Schedule a Meeting" (D) option when selected. */
  meetingUrl?: string;
  /** Selected banner id, if any. */
  bannerId?: string;
}
