# Luna
LUNA AI STORE BUILDER FOR AFRICA

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

The app lives in `app/page.js` (Next.js App Router). Replace the `VIDEO_ID_*`
placeholders before launch.

- `lib/africa.js` — all 54 African countries, their main cities and local payment methods, plus the support WhatsApp number.
- `lib/luna.js` — Luna's chat engine (products, budgets, payments, delivery, pricing, marketing). Market numbers are per-city estimates until live seller data is connected.

## Real AI (Claude)

Luna's chat uses Claude when an API key is set, and falls back to the built-in offline Luna when it isn't.

1. Get an API key at https://platform.claude.com
2. `cp .env.example .env.local` and paste the key after `ANTHROPIC_API_KEY=`
3. `npm run dev` (on Vercel/Render/etc., add `ANTHROPIC_API_KEY` in the host's environment variables)

- `app/api/luna/route.js` — server route that streams Claude's reply (the key never reaches the phone).
- `lib/lunaPrompt.js` — Luna's personality, rules, and the user's city / country / market data.
- Default model: `claude-opus-5-5`. Set `LUNA_MODEL` to change it (e.g. `claude-haiku-5-5` is much cheaper).
