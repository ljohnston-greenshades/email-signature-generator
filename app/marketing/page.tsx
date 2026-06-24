"use client";

import { useEffect, useState, useCallback } from "react";
import type { Banner } from "@/lib/types";

export default function MarketingPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);

  const refreshSession = useCallback(async () => {
    const r = await fetch("/api/auth/session");
    const d = await r.json();
    setAuthed(d.authed);
    setConfigured(d.configured);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  if (authed === null) {
    return (
      <main className="container">
        <p className="card-sub">Loading…</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="intro">
        <h1>Marketing — Banner Manager</h1>
        <p>
          Upload campaign banners and tag them with UTM tracking. Published banners become available
          to all employees in the signature builder.
        </p>
      </div>
      {authed ? (
        <BannerManager onSignOut={refreshSession} />
      ) : (
        <LoginForm configured={configured} onLoggedIn={refreshSession} />
      )}
    </main>
  );
}

function LoginForm({ configured, onLoggedIn }: { configured: boolean; onLoggedIn: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        onLoggedIn();
      } else {
        const d = await r.json().catch(() => ({}));
        setError(d.error || "Login failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 440 }}>
      <h2>Marketing sign in</h2>
      <p className="card-sub">
        Employees don't need to log in to build a signature — this area is for the Marketing team
        to manage banners.
      </p>
      {!configured && (
        <div className="notice notice-warn">
          Marketing login isn't configured on this deployment yet. Set the{" "}
          <code>MARKETING_PASSWORD</code> environment variable in Vercel.
        </div>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label>Marketing password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {error && <div className="notice notice-error">{error}</div>}
        <button className="btn btn-primary" disabled={busy || !configured}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function BannerManager({ onSignOut }: { onSignOut: () => void }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [blobConfigured, setBlobConfigured] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/banners");
    const d = await r.json();
    setBanners(d.banners || []);
    setBlobConfigured(d.blobConfigured !== false);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    onSignOut();
  }

  async function togglePublish(b: Banner) {
    await fetch(`/api/banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !b.published }),
    });
    load();
  }

  async function remove(b: Banner) {
    if (!confirm(`Delete banner "${b.name}"? This cannot be undone.`)) return;
    await fetch(`/api/banners/${b.id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="btn-row" style={{ justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-secondary" onClick={signOut}>
          Sign out
        </button>
      </div>

      {!blobConfigured && (
        <div className="notice notice-warn">
          Banner storage isn't connected yet. In Vercel, add a <strong>Blob</strong> store to this
          project (Storage → Create → Blob); it sets <code>BLOB_READ_WRITE_TOKEN</code> automatically.
          Until then, uploads will fail.
        </div>
      )}

      <UploadForm onUploaded={load} disabled={!blobConfigured} />

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Current banners</h2>
        {loading ? (
          <p className="card-sub">Loading…</p>
        ) : banners.length === 0 ? (
          <p className="card-sub">No banners yet. Upload your first above.</p>
        ) : (
          <div className="banner-grid">
            {banners.map((b) => (
              <div key={b.id} className="banner-tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt={b.alt} />
                <div className="bname">{b.name}</div>
                <div style={{ margin: "6px 0" }}>
                  <span className={`tag ${b.published ? "tag-published" : "tag-draft"}`}>
                    {b.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="burl">→ {b.trackedUrl}</div>
                <div className="btn-row" style={{ marginTop: 10 }}>
                  <button className="btn btn-secondary" onClick={() => togglePublish(b)}>
                    {b.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ color: "#a02213" }}
                    onClick={() => remove(b)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function UploadForm({ onUploaded, disabled }: { onUploaded: () => void; disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/banners", { method: "POST", body: form });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setSuccess(`Banner "${d.banner?.name}" saved.`);
        (e.target as HTMLFormElement).reset();
        onUploaded();
      } else {
        setError(d.error || "Upload failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Upload a banner</h2>
      <p className="card-sub">
        PNG, JPEG, or GIF (Outlook can't render SVG), under 1.5 MB. Recommended width 460px to match
        the signature.
      </p>
      <form onSubmit={submit}>
        <div className="field">
          <label>
            Banner name <span className="required-star">*</span>
          </label>
          <input type="text" name="name" placeholder="Q2 Payroll Webinar" required />
        </div>
        <div className="field">
          <label>
            Image file <span className="required-star">*</span>
          </label>
          <input type="file" name="image" accept="image/png,image/jpeg,image/gif" required />
        </div>
        <div className="utm-grid">
          <div className="field">
            <label>Display width (px)</label>
            <input type="number" name="width" defaultValue={460} min={120} max={600} />
          </div>
          <div className="field">
            <label>Alt text</label>
            <input type="text" name="alt" placeholder="Register for our Q2 webinar" />
          </div>
        </div>
        <div className="field">
          <label>
            Destination URL <span className="required-star">*</span>
          </label>
          <input type="url" name="destinationUrl" placeholder="https://go.greenshades.com/webinar" required />
        </div>

        <hr className="divider" />
        <p className="preview-label" style={{ marginTop: 0 }}>
          UTM tracking
        </p>
        <div className="utm-grid">
          <div className="field">
            <label>utm_source</label>
            <input type="text" name="utm_source" defaultValue="email_signature" />
          </div>
          <div className="field">
            <label>utm_medium</label>
            <input type="text" name="utm_medium" defaultValue="email" />
          </div>
          <div className="field">
            <label>utm_campaign</label>
            <input type="text" name="utm_campaign" placeholder="q2_webinar" />
          </div>
          <div className="field">
            <label>utm_content</label>
            <input type="text" name="utm_content" placeholder="signature_banner" />
          </div>
          <div className="field">
            <label>utm_term</label>
            <input type="text" name="utm_term" placeholder="(optional)" />
          </div>
        </div>

        <div className="field">
          <label className="checkbox-row" style={{ border: "none", padding: 0 }}>
            <input type="checkbox" name="published" value="true" defaultChecked />
            <span>Publish immediately (visible to all employees)</span>
          </label>
        </div>

        {error && <div className="notice notice-error">{error}</div>}
        {success && <div className="notice notice-success">{success}</div>}

        <button className="btn btn-primary" disabled={busy || disabled}>
          {busy ? "Uploading…" : "Upload banner"}
        </button>
      </form>
    </div>
  );
}
