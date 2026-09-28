"use client";

import { useRef, useState } from "react";

type Photo = { id: string; url: string; caption: string; name?: string };

export default function CustomerWall({ initial }: { initial: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!caption.trim()) {
      setError("Add a caption first.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const form = new FormData();
      form.append("photo", file);
      form.append("caption", caption.trim());
      if (name.trim()) form.append("name", name.trim());
      const res = await fetch("/api/admin/customer-photos", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Upload failed.");
      setPhotos(body.photos);
      setCaption("");
      setName("");
      setDone(true);
      window.setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removePhoto(id: string) {
    if (!confirm("Take this photo off the site?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/customer-photos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not remove it.");
      setPhotos(body.photos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12">
      <p className="eyebrow-spark">Parea Mas</p>
      <h2 className="mt-3 font-display text-2xl font-semibold text-cobalt-dark">
        Customer wall
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">
        Write the caption, then pick the photo. It goes live straight away.
      </p>

      <div className="tile-card mt-5 space-y-3.5 p-5">
        <div>
          <label htmlFor="caption" className="block text-sm font-semibold">
            Caption
          </label>
          <input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Every Friday since the nineties. Lamb, extra garlic."
            className="mt-1.5 w-full border border-ink/20 bg-white px-3 py-2.5 text-base"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-semibold">
            Name <span className="font-normal text-ink/50">(optional)</span>
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kosta"
            className="mt-1.5 w-full border border-ink/20 bg-white px-3 py-2.5 text-base"
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="btn-coal w-full disabled:opacity-60"
        >
          {busy ? "Uploading…" : "Choose photo & add"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}
      {done && (
        <p className="mt-4 rounded-sm bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          ✓ Added — it&rsquo;s live.
        </p>
      )}

      <p className="mt-6 text-sm font-semibold text-ink/60">
        On the wall ({photos.length})
      </p>
      {photos.length === 0 ? (
        <p className="mt-2 text-sm text-ink/45">
          Nothing yet. The section shows an invitation until you add one.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {photos.map((p) => (
            <li key={p.id} className="flex gap-3 rounded-sm border border-cobalt/15 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption}
                className="h-16 w-16 shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-ink/75">{p.caption}</p>
                {p.name && (
                  <p className="mt-0.5 text-xs font-semibold text-cobalt-dark">{p.name}</p>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => removePhoto(p.id)}
                className="shrink-0 self-start text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 text-xs leading-relaxed text-ink/45">
        Ask before you post someone&rsquo;s face. Up to 12 photos.
      </p>
    </section>
  );
}
