"use client";

import { useEffect, useRef } from "react";

/**
 * Renders signature HTML inside an iframe so the email's inline styles are
 * isolated from the app UI and the preview matches what a mail client shows.
 * The iframe auto-sizes to its content.
 */
export default function SignaturePreview({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const resize = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          iframe.style.height = `${doc.body.scrollHeight + 24}px`;
        }
      } catch {
        /* cross-origin guard — not applicable for srcDoc */
      }
    };
    iframe.addEventListener("load", resize);
    // Initial + delayed resize to catch image load.
    resize();
    const t = setTimeout(resize, 400);
    return () => {
      iframe.removeEventListener("load", resize);
      clearTimeout(t);
    };
  }, [html]);

  return (
    <iframe
      ref={ref}
      className="preview-frame"
      title="Signature preview"
      srcDoc={html}
      sandbox="allow-same-origin"
    />
  );
}
