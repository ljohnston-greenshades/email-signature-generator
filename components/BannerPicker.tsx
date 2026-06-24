"use client";

import type { Banner } from "@/lib/types";

export default function BannerPicker({
  banners,
  selectedId,
  onSelect,
  loading,
}: {
  banners: Banner[];
  selectedId?: string;
  onSelect: (id?: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return <p className="card-sub">Loading available banners…</p>;
  }
  if (banners.length === 0) {
    return (
      <p className="card-sub">
        No marketing banners are available right now. Your signature looks great without one.
      </p>
    );
  }

  return (
    <>
      <div className="banner-grid">
        <button
          type="button"
          className={`banner-tile${!selectedId ? " selected" : ""}`}
          onClick={() => onSelect(undefined)}
          style={{ textAlign: "left", cursor: "pointer" }}
        >
          <div
            style={{
              height: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              border: "1px dashed #cdd5df",
              borderRadius: 4,
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            No banner
          </div>
          <div className="bname">None</div>
        </button>

        {banners.map((b) => (
          <button
            type="button"
            key={b.id}
            className={`banner-tile${selectedId === b.id ? " selected" : ""}`}
            onClick={() => onSelect(b.id)}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imageUrl} alt={b.alt} />
            <div className="bname">{b.name}</div>
          </button>
        ))}
      </div>
    </>
  );
}
