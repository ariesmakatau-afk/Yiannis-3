// lib/social/publish.ts
//
// Sends one post out to each of its channels and records what happened.
// A failure on one platform never stops the others; the post ends up
// "published", "partial" or "failed", with the reason per channel so the
// owner can see it in /admin/social and retry.

import { absoluteUrl } from "@/lib/social/library";
import { publishToFacebook, publishToInstagram } from "@/lib/social/meta";
import { updatePost } from "@/lib/social/store";
import type { Channel, ChannelResult, PostStatus, SocialPost } from "@/lib/social/types";

async function sendTo(channel: Channel, post: SocialPost, imageUrl: string | null) {
  if (channel !== "website" && post.image_url && !imageUrl) {
    // Facebook/Instagram fetch the photo themselves, so it needs a full address.
    throw new Error("Set SITE_URL so the website's own photos can be shared.");
  }
  switch (channel) {
    case "facebook":
      return publishToFacebook(post.caption, imageUrl);
    case "instagram":
      return publishToInstagram(post.caption, imageUrl);
    case "website":
      // The website reads published posts straight from the database, so
      // there's nothing to send — marking it done is what makes it live.
      return { id: post.id, link: "/whats-on" };
  }
}

export async function publishPost(post: SocialPost): Promise<SocialPost> {
  const imageUrl = absoluteUrl(post.image_url);

  const results: Partial<Record<Channel, ChannelResult>> = { ...post.results };
  for (const channel of post.channels) {
    // Retrying a partial post must not double-post where it already worked.
    if (results[channel]?.ok) continue;
    const at = new Date().toISOString();
    try {
      const r = await sendTo(channel, post, imageUrl);
      results[channel] = { ok: true, id: r.id, link: r.link, at };
    } catch (err) {
      results[channel] = {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        at,
      };
    }
  }

  const outcomes = post.channels.map((c) => results[c]?.ok === true);
  const status: PostStatus = outcomes.every(Boolean)
    ? "published"
    : outcomes.some(Boolean)
      ? "partial"
      : "failed";

  const saved = await updatePost(post.id, {
    results,
    status,
    published_at: status === "failed" ? null : new Date().toISOString(),
  });
  return saved ?? { ...post, results, status };
}
