"use client";

import { useEffect, useMemo, useState } from "react";
import { STANDARD_LINKS, type StandardLinkId } from "@/lib/brand";
import { renderFullSignature, renderReplySignature } from "@/lib/signature";
import type { Banner, SignatureConfig } from "@/lib/types";
import SignaturePreview from "@/components/SignaturePreview";
import BannerPicker from "@/components/BannerPicker";
import InstallInstructions from "@/components/InstallInstructions";

const EMPTY: SignatureConfig = {
  name: "",
  title: "",
  email: "",
  phone: "",
  includeLinkedIn: false,
  linkedInUrl: "",
  links: [],
  meetingUrl: "",
  bannerId: undefined,
};

export default function BuilderPage() {
  const [config, setConfig] = useState<SignatureConfig>(EMPTY);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [copied, setCopied] = useState<"full" | "reply" | null>(null);

  // HubSpot directory prefill
  const [lookupEnabled, setLookupEnabled] = useState(false);
  const [lookupDomain, setLookupDomain] = useState("greenshades.com");
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((d) => setBanners(d.banners || []))
      .catch(() => setBanners([]))
      .finally(() => setBannersLoading(false));

    fetch("/api/lookup")
      .then((r) => r.json())
      .then((d) => {
        setLookupEnabled(Boolean(d.configured));
        if (d.domain) setLookupDomain(d.domain);
      })
      .catch(() => setLookupEnabled(false));
  }, []);

  async function prefillFromDirectory(e: React.FormEvent) {
    e.preventDefault();
    setLookupBusy(true);
    setLookupMsg(null);
    try {
      const r = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail }),
      });
      const d = await r.json();
      if (!r.ok) {
        setLookupMsg({ type: "error", text: d.error || "Lookup failed." });
      } else if (d.found) {
        setConfig((c) => ({
          ...c,
          name: d.name || c.name,
          title: d.title || c.title,
          phone: d.phone || c.phone,
          email: d.email || lookupEmail,
        }));
        const filled = ["name", "title", "phone"].filter((k) => d[k]);
        setLookupMsg({
          type: "success",
          text: `Found your details (${filled.join(", ") || "email"}). Review and edit anything below.`,
        });
      } else {
        // Still drop the email in so they don't retype it.
        setConfig((c) => ({ ...c, email: lookupEmail }));
        setLookupMsg({
          type: "info",
          text: "We couldn't find a directory match — just fill in your details below.",
        });
      }
    } catch {
      setLookupMsg({ type: "error", text: "Network error." });
    } finally {
      setLookupBusy(false);
    }
  }

  const selectedBanner = useMemo(
    () => banners.find((b) => b.id === config.bannerId),
    [banners, config.bannerId]
  );

  const ready = config.name.trim().length > 0 && config.title.trim().length > 0;

  const fullHtml = useMemo(
    () => renderFullSignature(config, { banner: selectedBanner }),
    [config, selectedBanner]
  );
  const replyHtml = useMemo(() => renderReplySignature(config), [config]);

  function update<K extends keyof SignatureConfig>(key: K, value: SignatureConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function toggleLink(id: StandardLinkId) {
    setConfig((c) => ({
      ...c,
      links: c.links.includes(id) ? c.links.filter((l) => l !== id) : [...c.links, id],
    }));
  }

  async function copySignature(which: "full" | "reply") {
    const html = which === "full" ? fullHtml : replyHtml;
    const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      setCopied(which);
      setTimeout(() => setCopied(null), 2200);
    } catch {
      // Fallback: copy raw HTML as text.
      await navigator.clipboard.writeText(html);
      setCopied(which);
      setTimeout(() => setCopied(null), 2200);
    }
  }

  function download(which: "full" | "reply") {
    const html = which === "full" ? fullHtml : replyHtml;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = which === "full" ? "Greenshades - Full.htm" : "Greenshades - Reply.htm";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container">
      <div className="intro">
        <h1>Greenshades Email Signature Builder</h1>
        <p>
          Create your personalized, brand-compliant signature for Outlook in about two minutes.
          Fonts, colors, the logo, and layout are standardized — you fill in your details and pick
          the optional elements that fit your role.
        </p>
      </div>

      <div className="layout">
        {/* ----------------------------- FORM ----------------------------- */}
        <div>
          {lookupEnabled && (
            <div className="card" style={{ marginBottom: 24, borderColor: "#cfe0fb" }}>
              <h2>⚡ Start with your directory details</h2>
              <p className="card-sub">
                Enter your Greenshades email and we'll prefill your name, title, and phone from the
                company directory. You can edit everything afterward.
              </p>
              <form onSubmit={prefillFromDirectory}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="email"
                    value={lookupEmail}
                    placeholder={`you@${lookupDomain}`}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    style={{
                      flex: "1 1 220px",
                      padding: "9px 11px",
                      border: "1px solid #cdd5df",
                      borderRadius: 7,
                      fontSize: 14,
                      fontFamily: "inherit",
                    }}
                  />
                  <button className="btn btn-primary" disabled={lookupBusy || !lookupEmail.trim()}>
                    {lookupBusy ? "Looking up…" : "Prefill"}
                  </button>
                </div>
              </form>
              {lookupMsg && (
                <div className={`notice notice-${lookupMsg.type}`} style={{ marginTop: 14, marginBottom: 0 }}>
                  {lookupMsg.text}
                </div>
              )}
            </div>
          )}

          <div className="card">
            <h2>Your details</h2>
            <p className="card-sub">
              Name and title are required. Everything else is optional — include what's relevant.
            </p>

            <div className="field">
              <label>
                Full name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                value={config.name}
                placeholder="First Last"
                onChange={(e) => update("name", e.target.value)}
              />
            </div>

            <div className="field">
              <label>
                Job title <span className="required-star">*</span>
              </label>
              <input
                type="text"
                value={config.title}
                placeholder="Account Executive"
                onChange={(e) => update("title", e.target.value)}
              />
            </div>

            <div className="field">
              <label>
                Email <span className="hint">— optional</span>
              </label>
              <input
                type="email"
                value={config.email}
                placeholder="you@greenshades.com"
                onChange={(e) => update("email", e.target.value)}
              />
            </div>

            <div className="field">
              <label>
                Phone <span className="hint">— optional, auto-formatted to (XXX) XXX-XXXX</span>
              </label>
              <input
                type="tel"
                value={config.phone}
                placeholder="555 555 5555"
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <hr className="divider" />

            <div className="field" style={{ marginBottom: 8 }}>
              <div className="checkbox-row" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <input
                  id="li"
                  type="checkbox"
                  checked={config.includeLinkedIn}
                  onChange={(e) => update("includeLinkedIn", e.target.checked)}
                />
                <div>
                  <label htmlFor="li" style={{ marginBottom: 2 }}>
                    Include LinkedIn
                  </label>
                  <div className="meta">
                    Shows polished text — <em>"Connect with me on LinkedIn"</em> — linked to your
                    profile (never a raw URL).
                  </div>
                </div>
              </div>
              {config.includeLinkedIn && (
                <div style={{ marginTop: 10 }}>
                  <input
                    type="url"
                    value={config.linkedInUrl}
                    placeholder="https://www.linkedin.com/in/yourprofile"
                    onChange={(e) => update("linkedInUrl", e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ----------------------------- LINKS ----------------------------- */}
          <div className="card" style={{ marginTop: 24 }}>
            <h2>Standard links</h2>
            <p className="card-sub">
              Optional links shown below your logo. Text and URLs for the first three are locked for
              brand consistency.
            </p>
            {STANDARD_LINKS.map((link) => (
              <div key={link.id}>
                <div className="checkbox-row">
                  <input
                    id={`link-${link.id}`}
                    type="checkbox"
                    checked={config.links.includes(link.id)}
                    onChange={() => toggleLink(link.id)}
                  />
                  <div>
                    <label htmlFor={`link-${link.id}`} style={{ marginBottom: 2 }}>
                      {link.text}
                    </label>
                    <div className="meta">
                      {link.requiresUrl ? link.helper : link.url}
                    </div>
                  </div>
                </div>
                {link.requiresUrl && config.links.includes(link.id) && (
                  <div className="field" style={{ marginTop: 10, marginBottom: 4 }}>
                    <input
                      type="url"
                      value={config.meetingUrl}
                      placeholder="https://calendly.com/your-name"
                      onChange={(e) => update("meetingUrl", e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ----------------------------- BANNER ----------------------------- */}
          <div className="card" style={{ marginTop: 24 }}>
            <h2>Marketing banner</h2>
            <p className="card-sub">
              Optionally add a current marketing banner below your signature. Banners are managed by
              Marketing and include campaign tracking.
            </p>
            <BannerPicker
              banners={banners}
              selectedId={config.bannerId}
              onSelect={(id) => update("bannerId", id)}
              loading={bannersLoading}
            />
          </div>
        </div>

        {/* ----------------------------- PREVIEW ----------------------------- */}
        <div>
          <div className="card" style={{ position: "sticky", top: 16 }}>
            <h2>Live preview</h2>
            <p className="card-sub">
              This is exactly what recipients will see. Copy it straight into Outlook.
            </p>

            {!ready && (
              <div className="notice notice-info">
                Enter your <strong>name</strong> and <strong>title</strong> to enable copy &amp;
                download.
              </div>
            )}

            <p className="preview-label">Full signature — for new messages</p>
            <SignaturePreview html={fullHtml} />
            <div className="btn-row">
              <button
                className="btn btn-primary"
                disabled={!ready}
                onClick={() => copySignature("full")}
              >
                {copied === "full" ? "✓ Copied!" : "Copy full signature"}
              </button>
              <button className="btn btn-secondary" disabled={!ready} onClick={() => download("full")}>
                Download .htm
              </button>
            </div>

            <p className="preview-label">Reply signature — for replies &amp; forwards</p>
            <SignaturePreview html={replyHtml} />
            <div className="btn-row">
              <button
                className="btn btn-primary"
                disabled={!ready}
                onClick={() => copySignature("reply")}
              >
                {copied === "reply" ? "✓ Copied!" : "Copy reply signature"}
              </button>
              <button
                className="btn btn-secondary"
                disabled={!ready}
                onClick={() => download("reply")}
              >
                Download .htm
              </button>
            </div>
          </div>
        </div>
      </div>

      <InstallInstructions />
    </main>
  );
}
