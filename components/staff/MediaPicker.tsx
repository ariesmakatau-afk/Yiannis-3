"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaItem, MediaSource } from "@/lib/social/types";

const TABS: { id: MediaSource; label: string }[] = [
  { id: "upload", label: "Uploaded" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "site", label: "Website" },
];

/**
 * Pick a photo from the library, or upload a new one. Facebook/Instagram
 * photos are copied into our storage by the server when chosen.
 */
export default function MediaPicker({
  onPick,
  onClose,
}: {
  onPick: (item: MediaItem) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<MediaSource>("upload");
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (source: MediaSource) => {
    setItems(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/social/media?source=${source}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not load photos.");
      setItems(body.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load photos.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/admin/social/media", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Upload failed.");
      onPick(body.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  // Portal to <body> so the dialog sits above the sticky site header rather
  // than inside whichever card opened it.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose a photo"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-t-lg bg-white sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-cobalt/15 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-cobalt-dark">Choose a photo</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold text-ink/60">
            Close
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-cobalt/10 px-5 py-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`chip-option !py-1.5 ${tab === t.id ? "chip-option--on" : ""}`}
            >
              {t.label}
            </button>
          ))}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="btn-coal ml-auto !px-5 !py-2 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload new"}
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {error && (
            <p role="alert" className="mb-4 rounded-sm bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </p>
          )}
          {items === null ? (
            <p className="text-sm text-ink/50">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-ink/50">
              {tab === "upload"
                ? "Nothing uploaded yet — use “Upload new”. JPGs work everywhere; Instagram won’t take PNG or WEBP."
                : tab === "site"
                  ? "No website photos found."
                  : `No ${tab === "facebook" ? "Facebook" : "Instagram"} photos — is the account connected? (See the setup notes.)`}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <li key={`${item.source}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => onPick(item)}
                    className="group block w-full overflow-hidden rounded-sm border border-cobalt/15 text-left transition hover:border-cobalt focus-visible:border-cobalt"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumb}
                      alt={item.label}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition group-hover:opacity-90"
                    />
                    <span className="block truncate px-2 py-1.5 text-xs text-ink/60">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
