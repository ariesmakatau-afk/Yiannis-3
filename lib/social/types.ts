// lib/social/types.ts — shapes shared by the social planner's server code
// and the admin screens. No server imports here, so client components can
// use it.

export type Channel = "facebook" | "instagram" | "website";
export const CHANNELS: Channel[] = ["facebook", "instagram", "website"];

export type PostStatus =
  | "draft" // written, waiting for the owner
  | "approved" // owner said yes; goes out on its day
  | "published" // out on every channel it was meant for
  | "partial" // out on some channels, failed on others
  | "failed" // failed everywhere — see results
  | "skipped"; // owner said no

export type ChannelResult = {
  ok: boolean;
  /** Platform post id, when there is one. */
  id?: string;
  /** Link to the live post, when known. */
  link?: string;
  error?: string;
  at: string;
};

export type SocialPost = {
  id: string;
  week_start: string;
  post_date: string;
  scheduled_for: string;
  title: string;
  caption: string;
  image_url: string | null;
  channels: Channel[];
  event_id: string | null;
  status: PostStatus;
  results: Partial<Record<Channel, ChannelResult>>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShopEvent = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  image_url: string | null;
  is_public: boolean;
  created_at: string;
};

export type MediaSource = "upload" | "site" | "facebook" | "instagram";

export type MediaItem = {
  /** Stable key within its source. */
  id: string;
  source: MediaSource;
  /** Full-size URL. For Facebook/Instagram this is temporary — import it before use. */
  url: string;
  thumb: string;
  label: string;
  createdAt?: string | null;
};
