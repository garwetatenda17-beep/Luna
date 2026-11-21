# LUNA — Africa's AI marketplace

The LUNA app is one file: **`standalone/index.html`**.

## Put LUNA online (free, ~10 minutes)
1. Merge this branch into `main` on GitHub.
2. Go to **vercel.com** → sign up with GitHub → **Add New → Project** → pick this repository.
3. **Root Directory: `standalone`** · Framework: **Other** → **Deploy**.
4. Open your new address (e.g. `https://luna-xxx.vercel.app`) in Chrome on your phone → ⋮ → **Add to Home screen**.
5. Optional: put that address in `siteUrl` at the top of the script in `standalone/index.html` so store links always use it.

## Later (when you're ready)
- **Supabase (free):** orders land in LUNA automatically, your own photos show to customers, sign in from any phone. Steps in `standalone/README.md`.
- **Paynow:** instant EcoCash payments (`standalone/api/paynow.js`).
- **Claude API key:** real AI for Luna's chat and writing on your own website (needs a small server function like the Paynow one).

`app/` and `lib/` hold the first Next.js prototype; the live app is `standalone/`.
