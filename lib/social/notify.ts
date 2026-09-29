// lib/social/notify.ts
//
// Messages to the owner: "your week's posts are ready", and "today's post
// still needs a yes". Sent by Telegram (the same bot as orders, optionally
// to a different chat) and/or email through Resend — whichever is set up.

import { business } from "@/lib/content";
import { siteUrl } from "@/lib/social/library";
import { labelDate } from "@/lib/social/time";
import type { SocialPost } from "@/lib/social/types";

async function telegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.SOCIAL_TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
  });
  if (!res.ok) console.error("[social/notify] telegram failed:", await res.text());
  return res.ok;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

async function email(subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.SOCIAL_EMAIL_TO ?? process.env.DIGEST_EMAIL_TO;
  const from = process.env.DIGEST_EMAIL_FROM;
  if (!key || !to || !from) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: to.split(",").map((a) => a.trim()), subject, html }),
  });
  if (!res.ok) console.error("[social/notify] email failed:", await res.text());
  return res.ok;
}

function reviewLink(weekStart: string): string {
  const base = siteUrl() ?? "";
  return `${base}/admin/social?week=${weekStart}`;
}

export async function notifyWeekReady(weekStart: string, posts: SocialPost[]) {
  const link = reviewLink(weekStart);
  const lines = posts.map((p) => `• ${labelDate(p.post_date)} — ${p.title}`);
  const text = [
    `📅 Next week's posts are ready for you to check (${posts.length}).`,
    "",
    ...lines,
    "",
    `Review, change the photos and approve here:`,
    link,
    "",
    "Nothing goes out until you approve it.",
  ].join("\n");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1c3850;max-width:640px">
    <h2 style="margin:0 0 8px">Next week's posts are ready</h2>
    <p style="margin:0 0 16px;color:#556">${posts.length} drafts for the week of ${labelDate(weekStart)}. Nothing goes out until you approve it.</p>
    ${posts
      .map(
        (p) => `
      <div style="border:1px solid #dde5ea;border-radius:8px;padding:12px 14px;margin-bottom:10px">
        <strong>${escapeHtml(labelDate(p.post_date))} — ${escapeHtml(p.title)}</strong>
        <p style="margin:6px 0 0;white-space:pre-line;color:#334">${escapeHtml(p.caption)}</p>
      </div>`
      )
      .join("")}
    <p style="margin-top:18px">
      <a href="${escapeHtml(link)}" style="background:#1d4f91;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">Review &amp; approve</a>
    </p>
  </div>`;

  const [t, e] = await Promise.all([
    telegram(text),
    email(`${business.shortName} — next week's posts are ready`, html),
  ]);
  return { telegram: t, email: e };
}

export async function notifyNeedsApproval(posts: SocialPost[]) {
  if (posts.length === 0) return { telegram: false };
  const link = reviewLink(posts[0].week_start);
  const text = [
    `⏰ ${posts.length === 1 ? "Today's post hasn't" : `${posts.length} posts haven't`} been approved yet, so ${posts.length === 1 ? "it" : "they"} won't go out:`,
    ...posts.map((p) => `• ${labelDate(p.post_date)} — ${p.title}`),
    "",
    link,
  ].join("\n");
  return { telegram: await telegram(text) };
}

export async function notifyFailures(posts: SocialPost[]) {
  if (posts.length === 0) return;
  const text = [
    "⚠️ Some posts didn't go out everywhere:",
    ...posts.map((p) => {
      const errs = Object.entries(p.results)
        .filter(([, r]) => r && !r.ok)
        .map(([c, r]) => `${c}: ${r!.error}`)
        .join("; ");
      return `• ${labelDate(p.post_date)} — ${p.title} (${errs})`;
    }),
    "",
    reviewLink(posts[0].week_start),
  ].join("\n");
  await telegram(text);
}
