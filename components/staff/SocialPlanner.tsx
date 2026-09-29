"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MediaPicker from "@/components/staff/MediaPicker";
import { addDays, labelDate } from "@/lib/social/time";
import type { Channel, MediaItem, SocialPost } from "@/lib/social/types";
import { CHANNELS } from "@/lib/social/types";

export type PlannerStatus = {
  database: boolean;
  ai: boolean;
  facebook: boolean;
  instagram: boolean;
  siteUrl: boolean;
  /** "day": approved posts go out at the daily run. "exact": at their own time. */
  publishWindow: "day" | "exact";
};

const CHANNEL_LABEL: Record<Channel, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  website: "Website",
};

const STATUS_STYLE: Record<SocialPost["status"], { label: string; className: string }> = {
  draft: { label: "Needs your OK", className: "bg-amber-100 text-amber-900" },
  approved: { label: "Approved — scheduled", className: "bg-green-100 text-green-900" },
  published: { label: "Posted", className: "bg-cobalt text-white" },
  partial: { label: "Partly posted", className: "bg-orange-100 text-orange-900" },
  failed: { label: "Failed", className: "bg-red-100 text-red-900" },
  skipped: { label: "Skipped", className: "bg-ink/10 text-ink/60" },
};

async function call<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
  return json as T;
}

function shopTimeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Adelaide",
  });
}

export default function SocialPlanner({
  weekStart,
  today,
  initialPosts,
  status,
}: {
  weekStart: string;
  today: string;
  initialPosts: SocialPost[];
  status: PlannerStatus;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const drafts = posts.filter((p) => p.status === "draft").length;
  const live = posts.filter((p) => p.status !== "skipped").length;

  function replace(post: SocialPost) {
    setPosts((all) => {
      const others = all.filter((p) => p.id !== post.id);
      // A post moved to another week drops out of this view.
      return post.week_start === weekStart ? [...others, post] : others;
    });
  }

  async function draftWeek(redo: boolean) {
    if (redo && !confirm("Throw away this week's unapproved drafts and write new ones?")) return;
    setBusy("week");
    setError(null);
    setNotice(null);
    try {
      const r = await call<{ posts: SocialPost[]; writer: string | null; warning?: string; message?: string }>(
        "/api/admin/social/generate",
        "POST",
        { week: weekStart, note: note.trim() || undefined, replace: redo }
      );
      setPosts(r.posts);
      setNotice(
        r.warning ??
          r.message ??
          (r.writer === "ai"
            ? "Drafts are ready — check them over, then approve."
            : "Drafts made from templates. Add ANTHROPIC_API_KEY for posts written around your week.")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Drafting failed.");
    } finally {
      setBusy(null);
    }
  }

  async function approveAll() {
    setBusy("week");
    setError(null);
    try {
      const r = await call<{ posts: SocialPost[] }>("/api/admin/social/posts", "PATCH", {
        action: "approve_all",
        week: weekStart,
      });
      setPosts(r.posts);
      setNotice("All approved. They'll go out on their days.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve.");
    } finally {
      setBusy(null);
    }
  }

  const weekLabel = `${labelDate(weekStart)} – ${labelDate(addDays(weekStart, 6))}`;

  return (
    <main className="container-page max-w-4xl py-8">
      <p className="eyebrow-spark">Facebook · Instagram · Website</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-cobalt-dark">Social posts</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink/60">
        Every Sunday the week&rsquo;s posts are drafted from your events and offers, and you get a
        message to check them. Change anything, swap the photos, then approve. Nothing goes out
        until you do.
      </p>

      <ConnectionBar status={status} />

      {/* Week switcher */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push(`/admin/social?week=${addDays(weekStart, -7)}`)}
          className="rounded-full border border-cobalt/25 bg-white px-4 py-2 text-sm font-semibold text-cobalt-dark"
          aria-label="Previous week"
        >
          ‹ Prev
        </button>
        <p className="text-center font-display text-lg font-semibold text-cobalt-dark">{weekLabel}</p>
        <button
          type="button"
          onClick={() => router.push(`/admin/social?week=${addDays(weekStart, 7)}`)}
          className="rounded-full border border-cobalt/25 bg-white px-4 py-2 text-sm font-semibold text-cobalt-dark"
          aria-label="Next week"
        >
          Next ›
        </button>
      </div>

      {/* Week actions */}
      <div className="tile-card mt-4 space-y-3 bg-white p-5">
        <label htmlFor="week-note" className="block text-sm font-semibold">
          Anything special this week? <span className="font-normal text-ink/50">(optional)</span>
        </label>
        <textarea
          id="week-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. Closed Thursday for a family wedding. Push the lamb platters. New staff member Eleni starts Monday."
          className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null || !status.database || live >= 7}
            onClick={() => draftWeek(false)}
            className="btn-coal !py-2.5 disabled:opacity-60"
          >
            {busy === "week" ? "Working…" : live >= 7 ? "Week is full" : live > 0 ? "Fill the empty days" : "Draft this week"}
          </button>
          {drafts > 0 && (
            <>
              <button
                type="button"
                disabled={busy !== null}
                onClick={approveAll}
                className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Approve all {drafts} draft{drafts === 1 ? "" : "s"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => draftWeek(true)}
                className="rounded-full border border-cobalt/30 px-5 py-2.5 text-sm font-semibold text-cobalt-dark disabled:opacity-60"
              >
                Redo the drafts
              </button>
            </>
          )}
        </div>
        {busy === "week" && (
          <p className="text-xs text-ink/50">Writing the week and choosing photos — this can take a minute.</p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-4 rounded-sm bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{notice}</p>
      )}

      <ol className="mt-6 space-y-5">
        {days.map((day) => {
          const dayPosts = posts
            .filter((p) => p.post_date === day)
            .sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for));
          const past = day < today;
          return (
            <li key={day}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-cobalt-dark">
                  {labelDate(day)}
                  {day === today && <span className="ml-2 text-xs font-semibold uppercase text-ember-deep">Today</span>}
                </h2>
                {!past && (
                  <button
                    type="button"
                    onClick={() => setAdding(adding === day ? null : day)}
                    className="text-xs font-semibold text-cobalt underline-offset-2 hover:underline"
                  >
                    {adding === day ? "Cancel" : "+ Add a post"}
                  </button>
                )}
              </div>
              {adding === day && (
                <NewPostForm
                  day={day}
                  status={status}
                  onCreated={(p) => {
                    replace(p);
                    setAdding(null);
                  }}
                />
              )}
              {dayPosts.length === 0 && adding !== day ? (
                <p className="rounded-sm border border-dashed border-ink/20 bg-white/60 px-4 py-4 text-sm text-ink/45">
                  {past ? "Nothing posted." : "No post planned."}
                </p>
              ) : (
                <div className="space-y-4">
                  {dayPosts.map((p) => (
                    <PostCard
                      key={p.id}
                      post={p}
                      status={status}
                      onChange={replace}
                      onRemove={(id) => setPosts((all) => all.filter((x) => x.id !== id))}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}

// ---------------------------------------------------------------------------

function ConnectionBar({ status }: { status: PlannerStatus }) {
  const items: { label: string; ok: boolean; hint: string }[] = [
    { label: "Database", ok: status.database, hint: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" },
    { label: "AI writer", ok: status.ai, hint: "ANTHROPIC_API_KEY — without it, templates are used" },
    { label: "Facebook", ok: status.facebook, hint: "META_PAGE_ID / META_PAGE_ACCESS_TOKEN" },
    { label: "Instagram", ok: status.instagram, hint: "META_IG_USER_ID / META_PAGE_ACCESS_TOKEN" },
    { label: "Website", ok: status.database, hint: "Posts appear on /whats-on" },
  ];
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((i) => (
        <span
          key={i.label}
          title={i.ok ? `${i.label} connected` : `Not set up: ${i.hint}`}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            i.ok ? "bg-green-100 text-green-900" : "bg-ink/10 text-ink/55"
          }`}
        >
          <span aria-hidden="true">{i.ok ? "●" : "○"}</span>
          {i.label}
          <span className="sr-only">{i.ok ? " connected" : " not set up"}</span>
        </span>
      ))}
      {!status.siteUrl && (status.facebook || status.instagram) && (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          Set SITE_URL so website photos can be shared
        </span>
      )}
    </div>
  );
}

function ChannelToggles({
  value,
  onChange,
  status,
  disabled,
}: {
  value: Channel[];
  onChange: (v: Channel[]) => void;
  status: PlannerStatus;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Where to post">
      {CHANNELS.map((c) => {
        const on = value.includes(c);
        const connected = c === "website" ? status.database : status[c];
        return (
          <button
            key={c}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== c) : CHANNELS.filter((x) => x === c || value.includes(x)))}
            className={`chip-option !px-3 !py-1.5 !text-xs ${on ? "chip-option--on" : ""} disabled:opacity-60`}
            title={connected ? undefined : `${CHANNEL_LABEL[c]} isn't connected yet`}
          >
            {CHANNEL_LABEL[c]}
            {!connected && " (off)"}
          </button>
        );
      })}
    </div>
  );
}

function PhotoSlot({
  url,
  disabled,
  onPick,
  onClear,
}: {
  url: string | null;
  disabled?: boolean;
  onPick: (item: MediaItem) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Photo for this post" className="aspect-square w-full rounded-sm object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-sm border border-dashed border-ink/25 bg-white/50 px-3 text-center text-xs text-ink/45">
          No photo — Instagram needs one
        </div>
      )}
      {!disabled && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 rounded-full border border-cobalt/30 bg-white px-3 py-1.5 text-xs font-semibold text-cobalt-dark"
          >
            {url ? "Change" : "Choose photo"}
          </button>
          {url && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60"
            >
              Remove
            </button>
          )}
        </div>
      )}
      {open && (
        <MediaPicker
          onClose={() => setOpen(false)}
          onPick={(item) => {
            setOpen(false);
            onPick(item);
          }}
        />
      )}
    </div>
  );
}

function PostCard({
  post,
  status,
  onChange,
  onRemove,
}: {
  post: SocialPost;
  status: PlannerStatus;
  onChange: (p: SocialPost) => void;
  onRemove: (id: string) => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [caption, setCaption] = useState(post.caption);
  const [channels, setChannels] = useState<Channel[]>(post.channels);
  const [time, setTime] = useState(shopTimeOf(post.scheduled_for));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [keepPhoto, setKeepPhoto] = useState(true);

  const locked = post.status === "published" || post.status === "partial";
  const skipped = post.status === "skipped";
  const dirty =
    title !== post.title ||
    caption !== post.caption ||
    channels.join() !== post.channels.join() ||
    time !== shopTimeOf(post.scheduled_for);

  function sync(p: SocialPost) {
    setTitle(p.title);
    setCaption(p.caption);
    setChannels(p.channels);
    setTime(shopTimeOf(p.scheduled_for));
    onChange(p);
  }

  async function run(label: string, fn: () => Promise<SocialPost | null>) {
    setBusy(label);
    setError(null);
    try {
      const p = await fn();
      if (p) sync(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const edits = () => ({ title, caption, channels, ...(status.publishWindow === "exact" ? { time } : {}) });
  const patch = (extra: Record<string, unknown>) =>
    call<{ post: SocialPost }>("/api/admin/social/posts", "PATCH", { id: post.id, ...extra }).then((r) => r.post);

  const igProblem =
    channels.includes("instagram") && !post.image_url
      ? "Instagram needs a photo."
      : channels.includes("instagram") && post.image_url && !/\.jpe?g($|\?)/i.test(post.image_url)
        ? "Instagram only takes JPG photos."
        : null;

  return (
    <article className={`tile-card bg-white p-4 sm:p-5 ${skipped ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[post.status].className}`}>
          {STATUS_STYLE[post.status].label}
        </span>
        <span className="text-xs text-ink/50">
          {post.status === "published" || post.status === "partial"
            ? post.published_at
              ? `Posted ${new Date(post.published_at).toLocaleString("en-AU", { timeZone: "Australia/Adelaide", weekday: "short", hour: "numeric", minute: "2-digit" })}`
              : "Posted"
            : status.publishWindow === "exact"
              ? `Goes out at ${shopTimeOf(post.scheduled_for)} once approved`
              : "Goes out late morning once approved"}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
        <PhotoSlot
          url={post.image_url}
          disabled={locked || busy !== null}
          onPick={(item) => run("photo", () => patch({ image: { source: item.source, url: item.url } }))}
          onClear={() => run("photo", () => patch({ image: null }))}
        />

        <div className="min-w-0 space-y-3">
          <input
            aria-label="Headline (shown on the website)"
            value={title}
            disabled={locked}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm font-semibold disabled:bg-porcelain/50"
          />
          <div>
            <textarea
              aria-label="Caption"
              value={caption}
              disabled={locked}
              onChange={(e) => setCaption(e.target.value)}
              rows={7}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm leading-relaxed disabled:bg-porcelain/50"
            />
            <p className={`text-right text-xs ${caption.length > 2200 ? "text-red-700" : "text-ink/40"}`}>
              {caption.length} / 2200
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ChannelToggles value={channels} onChange={setChannels} status={status} disabled={locked} />
            {status.publishWindow === "exact" && !locked && (
              <label className="flex items-center gap-2 text-xs font-semibold text-ink/60">
                Time
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-sm border border-ink/20 px-2 py-1 text-sm"
                />
              </label>
            )}
          </div>
          {igProblem && !locked && !skipped && <p className="text-xs font-medium text-amber-800">⚠ {igProblem}</p>}
        </div>
      </div>

      {Object.keys(post.results).length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-cobalt/10 pt-3 text-xs">
          {(Object.entries(post.results) as [Channel, SocialPost["results"][Channel]][]).map(([c, r]) =>
            r ? (
              <li key={c} className={r.ok ? "text-green-800" : "text-red-800"}>
                {r.ok ? "✓" : "✗"} {CHANNEL_LABEL[c]}
                {r.ok && r.link ? (
                  <>
                    {" — "}
                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="underline">
                      view
                    </a>
                  </>
                ) : null}
                {!r.ok && ` — ${r.error}`}
              </li>
            ) : null
          )}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      {rewriting && (
        <div className="mt-4 space-y-2 rounded-sm bg-porcelain/60 p-3">
          <label htmlFor={`ins-${post.id}`} className="block text-xs font-semibold">
            What should change? <span className="font-normal text-ink/50">(optional)</span>
          </label>
          <input
            id={`ins-${post.id}`}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Shorter and funnier. Mention we're open late tonight."
            className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-ink/70">
            <input type="checkbox" checked={keepPhoto} onChange={(e) => setKeepPhoto(e.target.checked)} />
            Keep this photo (untick to let it choose another)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run("rewrite", async () => {
                  const r = await call<{ post: SocialPost }>("/api/admin/social/generate", "POST", {
                    id: post.id,
                    instruction,
                    keepPhoto,
                  });
                  setRewriting(false);
                  setInstruction("");
                  return r.post;
                })
              }
              className="btn-coal !px-5 !py-2 disabled:opacity-60"
            >
              {busy === "rewrite" ? "Rewriting…" : "Rewrite"}
            </button>
            <button type="button" onClick={() => setRewriting(false)} className="px-3 text-xs font-semibold text-ink/60">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!locked && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.status === "draft" && (
            <button
              type="button"
              disabled={busy !== null || channels.length === 0}
              onClick={() => run("approve", () => patch({ ...edits(), status: "approved" }))}
              className="rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy === "approve" ? "Saving…" : dirty ? "Save & approve" : "Approve"}
            </button>
          )}
          {dirty && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => run("save", () => patch(edits()))}
              className="rounded-full border border-cobalt/30 px-5 py-2 text-sm font-semibold text-cobalt-dark disabled:opacity-60"
            >
              {busy === "save" ? "Saving…" : "Save changes"}
            </button>
          )}
          {post.status === "approved" && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => run("unapprove", () => patch({ status: "draft" }))}
              className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink/70 disabled:opacity-60"
            >
              Hold back
            </button>
          )}
          {!skipped && status.ai && !rewriting && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setRewriting(true)}
              className="rounded-full border border-cobalt/30 px-4 py-2 text-sm font-semibold text-cobalt-dark disabled:opacity-60"
            >
              Rewrite with AI
            </button>
          )}
          {!skipped && (
            <button
              type="button"
              disabled={busy !== null || channels.length === 0}
              onClick={() => {
                if (!confirm("Post this everywhere ticked, right now?")) return;
                run("publish", async () => {
                  if (dirty) await patch(edits());
                  const r = await call<{ post: SocialPost }>("/api/admin/social/publish", "POST", { id: post.id });
                  return r.post;
                });
              }}
              className="rounded-full border border-cobalt/30 px-4 py-2 text-sm font-semibold text-cobalt-dark disabled:opacity-60"
            >
              {busy === "publish" ? "Posting…" : post.status === "failed" ? "Try again now" : "Post now"}
            </button>
          )}
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run("skip", () => patch({ status: skipped ? "draft" : "skipped" }))}
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink/60 disabled:opacity-60"
          >
            {skipped ? "Bring back" : "Skip"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              if (!confirm("Delete this post?")) return;
              setBusy("delete");
              try {
                await call(`/api/admin/social/posts?id=${encodeURIComponent(post.id)}`, "DELETE");
                onRemove(post.id);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not delete it.");
                setBusy(null);
              }
            }}
            className="ml-auto rounded-full px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      )}
      {post.status === "partial" && (
        <div className="mt-4">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              run("publish", async () => {
                const r = await call<{ post: SocialPost }>("/api/admin/social/publish", "POST", { id: post.id });
                return r.post;
              })
            }
            className="rounded-full border border-cobalt/30 px-4 py-2 text-sm font-semibold text-cobalt-dark disabled:opacity-60"
          >
            {busy === "publish" ? "Posting…" : "Retry the failed ones"}
          </button>
        </div>
      )}
    </article>
  );
}

function NewPostForm({
  day,
  status,
  onCreated,
}: {
  day: string;
  status: PlannerStatus;
  onCreated: (p: SocialPost) => void;
}) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [channels, setChannels] = useState<Channel[]>(["facebook", "instagram", "website"]);
  const [image, setImage] = useState<MediaItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const r = await call<{ post: SocialPost }>("/api/admin/social/posts", "POST", {
        post_date: day,
        title,
        caption,
        channels,
        image: image ? { source: image.source, url: image.url } : null,
      });
      onCreated(r.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tile-card mb-4 bg-white p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <PhotoSlot url={image?.thumb ?? null} onPick={setImage} onClear={() => setImage(null)} />
        <div className="space-y-3">
          <input
            aria-label="Headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline (for the website)"
            className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm font-semibold"
          />
          <textarea
            aria-label="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            placeholder="Write the post…"
            className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
          />
          <ChannelToggles value={channels} onChange={setChannels} status={status} />
          {error && <p className="text-sm font-medium text-red-800">{error}</p>}
          <button
            type="button"
            disabled={busy || !caption.trim() || channels.length === 0}
            onClick={save}
            className="btn-coal !py-2 disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add as draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
