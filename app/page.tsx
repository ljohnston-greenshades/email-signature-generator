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
  phone: "",
  includeLinkedIn: false,
  linkedInUrl: "",
  links: [],
  meetingUrl: "",
  bannerId: undefined,
  replyStyle: "compact",
};

const STEPS = [
  { id: 1, label: "Your details" },
  { id: 2, label: "Links" },
  { id: 3, label: "Banner" },
];

export default function BuilderPage() {
  const [config, setConfig] = useState<SignatureConfig>(EMPTY);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [copied, setCopied] = useState<"full" | "reply" | null>(null);
  const [step, setStep] = useState(1);

  // HubSpot directory prefill
  const [lookupEnabled, setLookupEnabled] = useState(false);
  const [lookupDomain, setLookupDomain] = useState("greenshades.com");
  const [lookupUser, setLookupUser] = useState("");
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
    // The domain is automated: people type only their username. If someone
    // pastes a full address anyway, respect it rather than double-appending.
    const entry = lookupUser.trim();
    const email = entry.includes("@") ? entry : `${entry}@${lookupDomain}`;
    try {
      const r = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) {
        setLookupMsg({ type: "error", text: d.error || "Lookup failed." });
      } else if (d.found) {
        setConfig((c) => {
          const next = {
            ...c,
            name: d.name || c.name,
            title: d.title || c.title,
            phone: d.phone || c.phone,
          };
          if (d.meetingUrl) {
            next.meetingUrl = d.meetingUrl;
            // Auto-select the "Schedule a Meeting" link (they can uncheck it).
            if (!next.links.includes("meeting")) next.links = [...next.links, "meeting"];
          }
          return next;
        });
        const filled = ["name", "title", "phone"].filter((k) => d[k]);
        if (d.meetingUrl) filled.push("meeting link");
        setLookupMsg({
          type: "success",
          text: `Found your details (${filled.join(", ") || "name"}). Review and edit anything below.`,
        });
      } else {
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

  // fullHtml is what gets copied (keeps the dark-mode logo swap). fullPreviewHtml
  // is what the iframe shows — always navy, since the preview is on white.
  const fullHtml = useMemo(
    () => renderFullSignature(config, { banner: selectedBanner }),
    [config, selectedBanner]
  );
  const fullPreviewHtml = useMemo(
    () => renderFullSignature(config, { banner: selectedBanner, preview: true }),
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
      await navigator.clipboard.writeText(html);
      setCopied(which);
      setTimeout(() => setCopied(null), 2200);
    }
  }

  return (
    <main className="container">
      <div className="intro">
        <h1>Greenshades Email Signature Builder</h1>
        <p>
          Create your personalized, brand-compliant signature for Outlook in about two minutes.
          Fonts, colors, the logo, and layout are standardized.
        </p>
      </div>

      <div className="layout">
        {/* --------------------------- STEPPED FORM --------------------------- */}
        <div>
          <div className="stepper">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`step-chip${step === s.id ? " active" : ""}${step > s.id ? " done" : ""}`}
                onClick={() => setStep(s.id)}
              >
                <span className="step-num">{step > s.id ? "✓" : s.id}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* STEP 1 — your details (+ directory prefill) */}
          {step === 1 && (
            <div className="card">
              <h2>Your details</h2>
              <p className="card-sub">
                Name and title are required. Everything else is optional — include what's relevant.
              </p>

              {lookupEnabled && (
                <div
                  style={{
                    background: "#eef5ff",
                    border: "1px solid #cfe0fb",
                    borderRadius: 8,
                    padding: 14,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#1e4a86", fontSize: 14, marginBottom: 4 }}>
                    ⚡ Start from the company directory
                  </div>
                  <div className="meta" style={{ marginBottom: 10 }}>
                    Type your username — we'll add <strong>@{lookupDomain}</strong> and prefill your
                    name, title, phone, and meeting link.
                  </div>
                  <form onSubmit={prefillFromDirectory}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <div
                        style={{
                          display: "flex",
                          flex: "1 1 200px",
                          border: "1px solid #cdd5df",
                          borderRadius: 7,
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        <input
                          type="text"
                          value={lookupUser}
                          placeholder="first.last"
                          autoComplete="username"
                          onChange={(e) => setLookupUser(e.target.value)}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            border: "none",
                            outline: "none",
                            padding: "9px 11px",
                            fontSize: 14,
                            fontFamily: "inherit",
                          }}
                        />
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0 12px",
                            background: "#f0f2f5",
                            color: "var(--muted)",
                            fontSize: 14,
                            whiteSpace: "nowrap",
                          }}
                        >
                          @{lookupDomain}
                        </span>
                      </div>
                      <button className="btn btn-primary" disabled={lookupBusy || !lookupUser.trim()}>
                        {lookupBusy ? "Looking up…" : "Prefill"}
                      </button>
                    </div>
                  </form>
                  {lookupMsg && (
                    <div
                      className={`notice notice-${lookupMsg.type}`}
                      style={{ marginTop: 12, marginBottom: 0 }}
                    >
                      {lookupMsg.text}
                    </div>
                  )}
                </div>
              )}

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
                      Adds a LinkedIn icon linked to your profile.
                    </div>
                  </div>
                </div>
                {config.includeLinkedIn && (
                  <div style={{ marginTop: 10 }}>
                    <input
                      type="text"
                      value={config.linkedInUrl}
                      placeholder="your-username  or  linkedin.com/in/your-username"
                      onChange={(e) => update("linkedInUrl", e.target.value)}
                    />
                    <div className="meta" style={{ marginTop: 4 }}>
                      Paste your full profile URL or just your username — we'll tidy it up.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 — standard links */}
          {step === 2 && (
            <div className="card">
              <h2>Standard links</h2>
              <p className="card-sub">
                Optional links shown below your logo. Text and URLs for the first two are locked for
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
                      <div className="meta">{link.requiresUrl ? link.helper : link.url}</div>
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
          )}

          {/* STEP 3 — marketing banner */}
          {step === 3 && (
            <div className="card">
              <h2>Marketing banner</h2>
              <p className="card-sub">
                Optionally add a current marketing banner below your signature. Banners are managed
                by Marketing and include campaign tracking.
              </p>
              <BannerPicker
                banners={banners}
                selectedId={config.bannerId}
                onSelect={(id) => update("bannerId", id)}
                loading={bannersLoading}
              />
            </div>
          )}

          {/* step navigation */}
          <div
            className="btn-row"
            style={{ justifyContent: "space-between", marginTop: 18, alignItems: "center" }}
          >
            {step > 1 ? (
              <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
                ← Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !ready}
              >
                Next →
              </button>
            ) : (
              <span className="meta">Done — copy your signature from the preview →</span>
            )}
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
                Enter your <strong>name</strong> and <strong>title</strong> in step 1 to enable
                copying.
              </div>
            )}

            <p className="preview-label">Full signature — for new messages</p>
            <SignaturePreview html={fullPreviewHtml} />
            <div className="btn-row">
              <button
                className="btn btn-primary"
                disabled={!ready}
                onClick={() => copySignature("full")}
              >
                {copied === "full" ? "✓ Copied!" : "Copy full signature"}
              </button>
            </div>

            <details className="reply-disclosure">
              <summary>
                Reply signature
                <span className="reply-hint">— optional, for replies &amp; forwards</span>
              </summary>
              <div style={{ marginTop: 14 }}>
                <div className="field" style={{ marginBottom: 14 }}>
                  <label>Style</label>
                  <select
                    value={config.replyStyle}
                    onChange={(e) =>
                      update("replyStyle", e.target.value as SignatureConfig["replyStyle"])
                    }
                  >
                    <option value="compact">Compact — name, title, company</option>
                    <option value="minimal">Minimal — name, company</option>
                    <option value="none">None</option>
                  </select>
                </div>
                {config.replyStyle === "none" ? (
                  <div className="notice notice-info" style={{ marginBottom: 0 }}>
                    No reply signature — your replies and forwards will use whatever default you keep
                    in Outlook (or none).
                  </div>
                ) : (
                  <>
                    <SignaturePreview html={replyHtml} />
                    <div className="btn-row">
                      <button
                        className="btn btn-primary"
                        disabled={!ready}
                        onClick={() => copySignature("reply")}
                      >
                        {copied === "reply" ? "✓ Copied!" : "Copy reply signature"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>

      <InstallInstructions hasReply={config.replyStyle !== "none"} />
    </main>
  );
}
