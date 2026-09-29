"use client";

import { useState } from "react";
import MediaPicker from "@/components/staff/MediaPicker";
import type { MediaItem, ShopEvent } from "@/lib/social/types";

type Form = {
  id?: string;
  title: string;
  date: string;
  start: string;
  end: string;
  location: string;
  description: string;
  is_public: boolean;
  /** undefined = keep the current photo, null = remove it */
  image?: MediaItem | null;
  currentImage: string | null;
};

const EMPTY: Form = {
  title: "",
  date: "",
  start: "18:00",
  end: "",
  location: "",
  description: "",
  is_public: true,
  currentImage: null,
};

const TZ = "Australia/Adelaide";
const dateOf = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

function toForm(e: ShopEvent): Form {
  return {
    id: e.id,
    title: e.title,
    date: dateOf(e.starts_at),
    start: timeOf(e.starts_at),
    end: e.ends_at ? timeOf(e.ends_at) : "",
    location: e.location ?? "",
    description: e.description,
    is_public: e.is_public,
    currentImage: e.image_url,
  };
}

export default function EventsManager({ initial, today }: { initial: ShopEvent[]; today: string }) {
  const [events, setEvents] = useState<ShopEvent[]>(initial);
  const [form, setForm] = useState<Form | null>(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upcoming = events.filter((e) => dateOf(e.ends_at ?? e.starts_at) >= today);
  const past = events.filter((e) => dateOf(e.ends_at ?? e.starts_at) < today).reverse();

  async function save() {
    if (!form) return;
    setBusy(true);
    setError(null);
    try {
      const { image, currentImage: _unused, ...rest } = form;
      const payload: Record<string, unknown> = { ...rest };
      if (image !== undefined) payload.image = image ? { source: image.source, url: image.url } : null;
      const res = await fetch("/api/admin/events", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save.");
      const saved = body.event as ShopEvent;
      setEvents((all) =>
        [...all.filter((e) => e.id !== saved.id), saved].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      );
      setForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this event? Posts already written about it stay as they are.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/events?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not delete.");
      setEvents((all) => all.filter((e) => e.id !== id));
      setForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  const photo = form?.image === undefined ? form?.currentImage : form.image?.thumb ?? null;

  return (
    <main className="container-page max-w-3xl py-8">
      <p className="eyebrow-spark">What&rsquo;s on</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-cobalt-dark">Events</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink/60">
        Specials, live music, footy nights, holiday hours, closures. Public events show on the
        website&rsquo;s What&rsquo;s On page, and every event is worked into the Sunday posts.
      </p>

      {!form && (
        <button type="button" onClick={() => setForm({ ...EMPTY, date: today })} className="btn-coal mt-5">
          + Add an event
        </button>
      )}

      {form && (
        <div className="tile-card mt-5 space-y-3.5 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-cobalt-dark">{form.id ? "Edit event" : "New event"}</h2>
          <Field label="Name">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Greek Independence Day — free baklava"
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Day">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Starts">
              <input
                type="time"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Ends (optional)">
              <input
                type="time"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
                className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Where (optional — leave blank for the shop)">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Details">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="What's happening, any deal, anything people should know. The post writer uses this."
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-20 w-20 rounded-sm object-cover" />
            ) : null}
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="rounded-full border border-cobalt/30 px-4 py-2 text-sm font-semibold text-cobalt-dark"
            >
              {photo ? "Change photo" : "Add a photo (optional)"}
            </button>
            {photo && (
              <button type="button" onClick={() => setForm({ ...form, image: null })} className="text-sm font-semibold text-ink/60">
                Remove photo
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            />
            Show on the website
            <span className="text-xs text-ink/50">(untick for private bookings — still used for planning)</span>
          </label>
          {error && <p className="text-sm font-medium text-red-800">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={save} className="btn-coal !py-2.5 disabled:opacity-60">
              {busy ? "Saving…" : "Save event"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="px-4 text-sm font-semibold text-ink/60">
              Cancel
            </button>
            {form.id && (
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(form.id!)}
                className="ml-auto px-4 text-sm font-semibold text-red-700"
              >
                Delete
              </button>
            )}
          </div>
          {picking && (
            <MediaPicker
              onClose={() => setPicking(false)}
              onPick={(item) => {
                setPicking(false);
                setForm({ ...form, image: item });
              }}
            />
          )}
        </div>
      )}

      <EventList title="Coming up" events={upcoming} empty="No events planned." onEdit={(e) => setForm(toForm(e))} />
      {past.length > 0 && (
        <EventList title="Recently" events={past} empty="" onEdit={(e) => setForm(toForm(e))} muted />
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function EventList({
  title,
  events,
  empty,
  onEdit,
  muted,
}: {
  title: string;
  events: ShopEvent[];
  empty: string;
  onEdit: (e: ShopEvent) => void;
  muted?: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-cobalt-dark">{title}</h2>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-ink/50">{empty}</p>
      ) : (
        <ul className={`mt-3 space-y-2 ${muted ? "opacity-60" : ""}`}>
          {events.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onEdit(e)}
                className="tile-card flex w-full items-center gap-3 bg-white p-3 text-left transition hover:border-cobalt"
              >
                {e.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image_url} alt="" className="h-12 w-12 shrink-0 rounded-sm object-cover" />
                ) : (
                  <span className="h-12 w-12 shrink-0 rounded-sm bg-porcelain" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-cobalt-dark">{e.title}</span>
                  <span className="block text-xs text-ink/55">
                    {new Date(e.starts_at).toLocaleString("en-AU", {
                      timeZone: TZ,
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {!e.is_public && " · private"}
                  </span>
                </span>
                <span className="text-xs font-semibold text-cobalt">Edit</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
