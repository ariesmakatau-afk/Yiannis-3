# Social media planner

One place in the admin for Facebook, Instagram, the website and events.

## How the week works

1. **Through the week**: add anything coming up at **/admin/events** (specials,
   live music, footy nights, holiday hours, closures). Public events are listed
   on the website's new **What's On** page (`/whats-on`, linked in the main nav).
2. **Sunday morning (about 9am, Adelaide time)**: the system drafts one post
   for each day of the coming week. It works from the events, the current
   offer (`lib/parea.ts` → `promo`), opening hours, the menu and the last few
   weeks of posts, so it doesn't repeat itself. It also looks through the photo
   library and picks a photo for each post.
3. **You get a message** (Telegram and/or email) listing the drafts, with a
   link to **/admin/social**.
4. **You review**: edit the wording, change or remove the photo (upload a new
   one, or choose from your uploads, your Facebook Page photos, your Instagram
   posts or the website's photos), untick a platform, ask the AI to rewrite a
   post ("shorter", "mention we're open late"), skip a day or add your own
   post. Then press **Approve**, or **Approve all**.
5. **Each day** the approved post goes out to Facebook, Instagram and the
   website. **Drafts are never posted.** If a day's post is still waiting at
   posting time, you get a reminder. If a platform rejects a post, you get a
   message and the post shows the reason and a **Retry** button.

You can also draft a week yourself at any time. Use the week arrows and
**Draft this week**, and optionally add a note first ("Closed Thursday for a
wedding"). **Post now** sends a post immediately.

## Setup

### 1. Database
Run the new section at the bottom of `supabase-schema.sql` in Supabase →
SQL Editor. It adds the `events` and `social_posts` tables and is safe to run
on the existing database. Photos use the existing public `media` bucket.

### 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | What it's for | Required? |
|---|---|---|
| `SITE_URL` | The live address, e.g. `https://yiannisonhindley.com.au`. Used for review links and so Facebook/Instagram can fetch the website's own photos. On Vercel it falls back to the production domain. | Recommended |
| `ANTHROPIC_API_KEY` | The AI writer (Claude). Without it, simple built-in templates fill the week instead, and "Rewrite with AI" is hidden. Get a key at console.anthropic.com. | Recommended |
| `META_PAGE_ID` | The Facebook Page's numeric id | For Facebook |
| `META_PAGE_ACCESS_TOKEN` | A long-lived **Page** access token (see below) | For Facebook + Instagram |
| `META_IG_USER_ID` | The Instagram Business/Creator account id linked to the Page | For Instagram |
| `SOCIAL_TELEGRAM_CHAT_ID` | Where the Sunday "ready to review" message goes. Defaults to `TELEGRAM_CHAT_ID` (the orders chat). Set this to send it to the owner's own chat instead. | Optional |
| `SOCIAL_EMAIL_TO` | Email for the Sunday message. Defaults to `DIGEST_EMAIL_TO`. Uses the existing Resend setup. | Optional |
| `SOCIAL_PUBLISH_WINDOW` | `day` (default) or `exact`. See "Posting times" below. | Optional |

`CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY` and `DIGEST_EMAIL_FROM`
are the ones already set up for orders. They're reused here.

The **Social posts** screen shows which of these are connected.

### 3. Connecting Facebook and Instagram

The Instagram account must be a **Business or Creator** account and be
**linked to the Facebook Page** (Instagram app → Settings → Account type and
tools; then Page settings → Linked accounts).

1. Go to developers.facebook.com → **My Apps → Create app** → type
   "Business". Add the products **Facebook Login for Business** and
   **Instagram Graph API**.
2. Open **Tools → Graph API Explorer**. Select the app, then **Get Token →
   Get User Access Token** with these permissions:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
   `instagram_basic`, `instagram_content_publish`, `business_management`.
3. Swap it for a long-lived user token (Access Token Debugger → **Extend
   Access Token**). Then, in the Explorer, call `GET /me/accounts` with that
   token. The `access_token` next to your Page is the **Page access token**.
   A Page token made from a long-lived user token doesn't expire. That's
   `META_PAGE_ACCESS_TOKEN`, and the `id` beside it is `META_PAGE_ID`.
4. Call `GET /{META_PAGE_ID}?fields=instagram_business_account`. The id
   returned is `META_IG_USER_ID`.

While the Meta app is in development mode, only accounts with a role on the
app can use it. That's fine here, because the owner's own Page and account
are the only ones it posts to.

## Posting times

Vercel's free plan only allows scheduled jobs once a day, so by default
(`SOCIAL_PUBLISH_WINDOW=day`) a daily job at **11am (12pm during daylight
saving)** posts everything approved for that day. It also sends the reminder
for anything still unapproved.

On Vercel Pro you can post at each post's own time. Change the
`/api/social/publish-due` schedule in `vercel.json` to `0 * * * *` (hourly),
and set `SOCIAL_PUBLISH_WINDOW=exact`. A time picker then appears on each post.

Schedules (in `vercel.json`, all UTC):
- `/api/social/weekly`: `0 23 * * 6`, which is Sunday 8:30am ACST / 9:30am ACDT
- `/api/social/publish-due`: `30 1 * * *`, which is daily 11:00am ACST / 12:00pm ACDT

## Things to know

- **Instagram needs a photo, and it must be a JPG.** Posts without one, or
  with a PNG/WEBP, fail on Instagram only. The post card warns you before you
  approve. Phone photos are JPGs.
- **Facebook Events can't be created automatically.** Meta closed that API in
  2018. Events live on the website, and the planner writes posts announcing
  them on the day (and teases big ones a day or two before).
- Photos chosen from Facebook/Instagram are copied into the site's storage
  first, because Meta's links expire.
- Captions end with a line of hashtags. The website hides that line.
- If the AI writer fails for any reason, the week is filled from templates
  and the screen tells you why. The Sunday message still goes out.
- The AI writer uses Claude (`claude-opus-5-5`). Each weekly draft is one
  request. With the up-to-16 photos it looks at, expect roughly 20–40 cents
  a week, plus a few cents per rewrite.

## Where the code is

| Path | What |
|---|---|
| `app/admin/social`, `components/staff/SocialPlanner.tsx` | Weekly review screen |
| `app/admin/events`, `components/staff/EventsManager.tsx` | Events |
| `components/staff/MediaPicker.tsx` | Photo library picker + upload |
| `app/whats-on/page.tsx` | Public events + website posts |
| `lib/social/generate.ts` | Drafting (Claude + template fallback) |
| `lib/social/meta.ts` | Facebook/Instagram Graph API |
| `lib/social/publish.ts` | Sends a post to its channels |
| `lib/social/notify.ts` | Telegram/email messages to the owner |
| `lib/social/library.ts` | The photo library |
| `app/api/social/weekly`, `app/api/social/publish-due` | Scheduled jobs |
| `app/api/admin/social/*`, `app/api/admin/events` | Admin API (staff login required) |
