"use client";

import Link from "next/link";
import CustomerWall from "@/components/staff/CustomerWall";
import { useRef, useState } from "react";

type Photo = { id: string; url: string; caption: string; name?: string };

export default function PhotoManager({
  initialUrl,
  wall,
}: {
  initialUrl: string | null;
  wall: Photo[];
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/admin/photo", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Upload failed.");
      setUrl(body.url);
      setDone(true);
      window.setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function clear() {
    if (!confirm("Remove the team photo from the site?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/photo", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove it.");
      setUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove it.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/staff/session", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-porcelain">
      <header className="border-b border-cobalt/15 bg-white">
        <div className="container-page flex items-center justify-between gap-4 py-3.5">
          <p className="font-display text-lg font-semibold text-cobalt-dark">Admin</p>
          <div className="flex items-center gap-2">
            <Link href="/kitchen" className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold">
              Kitchen
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container-page max-w-xl py-8">
        <p className="eyebrow-spark">Parea Mas</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-cobalt-dark">
          Team photo
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Uploading a new one replaces the old immediately. Only one is ever kept.
        </p>

        <div className="tile-card mt-6 p-5">
          {url ? (
            <>
              {/* Plain <img>: the URL is external and changes at runtime, so
                  next/image optimisation would need remote-host config for
                  no real benefit on a staff-only page. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Current team photo"
                className="aspect-[4/3] w-full rounded-sm object-cover"
              />
              <p className="mt-3 text-xs text-ink/45">Live on the Parea Mas page now.</p>
            </>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-sm border border-dashed border-ink/25 bg-white/50 text-center">
              <p className="px-6 text-sm text-ink/50">
                No photo yet. The section stays hidden on the site until you add one.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-sm bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}
        {done && (
          <p className="mt-4 rounded-sm bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            ✓ Uploaded — it&rsquo;s live.
          </p>
        )}

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

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="btn-coal disabled:opacity-60"
          >
            {busy ? "Uploading…" : url ? "Replace photo" : "Choose photo"}
          </button>
          {url && (
            <button
              type="button"
              disabled={busy}
              onClick={clear}
              className="rounded-sm border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-ink/45">
          JPG, PNG or WEBP, up to 8MB. Landscape photos look best.
        </p>

        <CustomerWall initial={wall} />
      </main>
    </div>
  );
}
