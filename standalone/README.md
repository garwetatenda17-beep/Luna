# LUNA — Africa's AI marketplace (one file)

`index.html` is the whole app. Open it in a browser, or deploy this folder to Vercel.

## What works right away (no setup)
Seller / Supplier modes, location (GPS or pick from 19 countries), suppliers sorted by distance
with range filter and price comparison, supplier registration, 3-tap shop builder, 7-day marketing
plan, Luna AI chat, seller dashboard, orders, wallet, promo videos, storefront, demo store,
auto-poster with approval alarm, and a test monitor. Everything is saved on that phone only.

## Testing with others (the shared claude.ai link)
In the claude.ai preview link, testers share one database: suppliers they register appear for
everyone, reports and activity reach the owner's Test monitor, and Luna AI chat / plans are written
by real AI. Share it from the page's Share menu and give testers "can use" (Contributor) access.

## Make orders real (from any phone) — Supabase, free
1. Create a project at supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Authentication → Email: keep Email on. In Email Templates → "Magic Link", add `{{ .Token }}`
   to the email so sellers get a 6-digit code.
4. Project Settings → API: copy the Project URL and the `anon public` key into
   `LUNA_CONFIG` at the top of the script in `index.html`.

## Instant EcoCash — Paynow
1. Paynow account → Receive Payments → create a 3rd-party integration → copy Integration ID + Key.
2. Deploy this folder to Vercel. In Project → Settings → Environment Variables add:
   `PAYNOW_INTEGRATION_ID`, `PAYNOW_INTEGRATION_KEY`, `PAYNOW_AUTH_EMAIL` (your Paynow login email),
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → API → service_role, keep secret),
   `PUBLIC_SITE_URL` (e.g. https://your-site.vercel.app).
3. Set `paynow: true` in `LUNA_CONFIG`.
While Paynow is in test mode, use their test EcoCash numbers (e.g. 0771111111 = success).

## Posting to social apps
LUNA writes the posts and, when you say YES, opens each app with the photo and caption ready.
You tap Send/Post in each app. Fully automatic posting needs approved developer apps from
Meta (Instagram/Facebook) and TikTok, plus a server. WhatsApp Status has no posting API.
Reminders ring while LUNA is open; the calendar alarm (Set Reminder) rings even when it's closed.
