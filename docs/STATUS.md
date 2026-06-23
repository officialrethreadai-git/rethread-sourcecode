# Status

> Living doc. Updated by `/handoff` at the end of each chat session so a new
> chat can pick up cold. Read this first, then `implementation-plan.md` for
> the architecture.

## Last updated
2026-06-23 — fourth session: major UX/design overhaul, Nigerian cultural AI
tuning, designer requests marketplace, search/filter, admin AI kill-switch,
fabric education cards (13 types + Nigerian tailoring materials awareness),
generated image local persistence, demo-without-login flow, homepage hero
rewrite. Pre-launch state — only missing sample fabric photos for demo buttons.

## Done so far

### Backend (`server/`, Node 24, Express, ES modules)
- `POST /api/scan` — Claude Haiku 4.5 vision. Returns `materialType`,
  `colorProfile`, `condition`, `confidencePercent`, `colors[]` (name+hex+role),
  `suggestedProducts[]`. Gated behind `req.session.aiApproved` (403
  `needsAuth:true` otherwise). Also checks `isAiPaused()` — returns 503
  `AI_PAUSED` if admin has paused the AI gate.
- `POST /api/generate` — fal.ai `fal-ai/flux-pro/kontext` ($0.04/image,
  confirmed). Takes fabric photo + product idea + optional sizeHint +
  materialType. Returns `/generated/<uuid>.jpg` (locally saved copy —
  fal.ai CDN URLs expire in ~1hr, local copy doesn't). Checks `isAiPaused()`.
  Nigerian/African model prompt: Ankara → modern Lagos studio; Aso-Oke →
  traditional ceremony courtyard; bags → model carrying; hats → styled flat-lay.
- `GET /api/marketplace` — in-memory listings, open to everyone.
- `GET /api/marketplace/requests` — designer requests board, open to everyone.
  3 seed requests pre-loaded. `POST /api/marketplace/requests` (aiApproved) to
  add new requests.
- `POST /api/marketplace` — list an item (aiApproved).
- `POST /api/marketplace/:id/reserve` — claim a listing (aiApproved, blocks
  self-reserve and double-reserve).
- `GET /api/marketplace/mine` — logged-in user's own listings + reservations +
  their posted requests.
- `GET /api/admin/ai-gate`, `POST /api/admin/ai-gate` — admin can pause/unpause
  all AI endpoints. State held in `server/src/lib/aiGate.js` (in-memory toggle).
- `GET /api/admin/accounts`, `POST /api/admin/accounts/:id/approve|deny`.
- `GET /api/admin/balances` — real fal.ai balance + Anthropic spend estimate.
- `POST /api/accounts/signup|login|logout`, `GET /api/accounts/me`.
- `POST /api/admin/login|logout`, `GET /api/admin/me`.
- Express serves `frontend/` statically including `frontend/generated/`
  (gitignored) where fal.ai images are saved.
- Error codes: `INSUFFICIENT_CREDIT` (402), `AI_UNAVAILABLE` (401),
  `AI_PAUSED` (503) — all handled distinctly on the frontend.

### Frontend (`frontend/`)
- **Visual system**: `.glass-panel` switched from translucent blur to solid
  `#FFFFFF` card with real shadow — was causing "fake/templatey" look. Body
  background `#EAE5D8` (forest-dark) so white cards pop. Decorative blur orbs
  now `hidden md:block` (mobile performance + clarity).
- **Touch targets**: all `sc-btn` min-height 44px, `sc-btn-sm` 40px, `sc-btn-lg`
  52px. Active scale press feedback added. Font-weight bumped to 700.
- **Icons**: feature cards + upload box + section headers use solid mint chips
  (bold green square, white icon) instead of pastel-tint rings.
- **Hero**: rewritten — "Got leftover fabric? Your AI turns it into money." +
  plain-English 1-line subtitle + 3-step icon flow (Snap → AI suggests → Sell)
  + dual CTA (Start for Free / See Live Demo). Waitlist form removed (real
  accounts exist now). "Landing Page" tab renamed to "Home".
- **Demo without login**: clicking "Sample Ankara" when not signed in shows
  `DEMO_SCAN_RESULT` (static pre-baked result) instantly — full scan summary,
  fabric education card, color palette, 3 product cards + notice banner. No API
  cost. `Generate Image` hits auth gate gracefully. Real API runs when signed in.
- **Fabric education cards** (`#fabric-lore-card`): appears after any scan for
  13 known fabric types. Shows origin, also-known-as, cultural description,
  market value. Types: Ankara, Aso-Oke, Adire, Kente, Denim, Lace, George,
  Guinea Brocade/Damask, Hollandaise, Atiku/Senator, Velvet, Chiffon, Satin,
  Cotton.
- **Color palette** (`#color-palette`): 2–4 hex swatches per scan. Click/tap
  any swatch or "Copy" to copy hex to clipboard. Auto light/dark text contrast.
- **Marketplace — two views**:
  - "Available Fabric": existing listings grid + search bar (title/keyword) +
    material-type dropdown filter (client-side).
  - "What Designers Need": requests board, `loadRequests()` from
    `/api/marketplace/requests`. "Post a Request" button opens a modal form
    (title, material type, color notes, quantity, budget). Requests badge count
    shown on toggle tab.
- **Admin AI gate** in `/admin.html`: banner at top of balances view showing
  ACTIVE/PAUSED state with one-click toggle button. Red border + pause icon when
  paused; green + check when active.
- **My Dashboard** (`#my-dashboard-container`): shows own listings, own
  reservations, own posted requests (via `GET /api/marketplace/mine`). Solid
  amber badge for "reserved" status.
- **Post a Request modal** (`#request-modal`): full form with fabric type
  dropdown matching all 13 lore types. Auth-gated (opens auth modal if not
  signed in).

### Claude prompt (anthropic.js) — complete overhaul this session
- **Size-aware**: estimates scrap size from photo (TINY/SMALL/MEDIUM/LARGE/VERY
  LARGE) and calibrates suggestions — no dress suggestions for a tiny scrap.
- **Color-specific**: every product description must name the actual colors seen
  in the photo (e.g. "the deep indigo and burnt orange print will pop at any
  owambe").
- **Outfit-first**: outfits are the PRIMARY suggestion for Nigerian fabrics at
  medium-to-large size. Accessories only for genuinely small pieces.
- **Nigerian cultural knowledge**: Ankara → wrap dress/Kaftan; Aso-Oke →
  ceremonial Gele/Iro & Buba; Adire → contemporary fashion + wall art; George →
  Iro wrappers/bridal; Denim → streetwear/patchwork; Lace → evening/bridal.
- **Supporting materials awareness**: suggests 1–2 supporting materials per
  product with real Balogun/Yaba 2025 prices (By-cotton lining, Airstay,
  invisible zip, hemming gum, bias tape — common; bra cup, rigilene bone,
  collar gum — only when relevant). Specialist items (steel bone, crinoline,
  hot-fix stones) only if specifically applicable.
- **Colors field**: returns 2–4 `{name, hex, role}` objects.
- `max_tokens` bumped to 1500 (was 1024 — was truncating richer responses).

### Admin / access control
- Single super-admin at `/admin.html`. Credentials: `ADMIN_USERNAME` +
  `ADMIN_PASSWORD_HASH` in `server/.env`. Change before real demo.
- **AI Kill-switch** (new): admin can pause ALL AI endpoints (scan + generate)
  from the admin panel without restarting the server. Use before demo, unpause
  when ready. State in `server/src/lib/aiGate.js`.
- fal.ai credit: ~$2.97 = ~74 more images at $0.04/image (confirmed via
  `fal-ai/flux-pro/kontext` pricing — this model cannot be swapped for a
  cheaper one since all cheaper options are text-to-image only, not
  image-to-image).
- `frontend/generated/` gitignored — locally saved fal.ai images go here.

### Deployment
- `render.yaml` at repo root — one Web Service. Secrets marked `sync: false`.
- `docs/DEPLOY.md` — push to GitHub → Render Blueprint → enter secrets → deploy.

## In progress
- Nothing mid-way. Server runs via `cd server && npm start`, serves
  `http://localhost:4000` and `http://localhost:4000/admin.html`.
- Claude prompt supporting-materials section just added — not yet tested with
  a real scan (server restarted with changes in place, but no scan run after).

## Next steps
1. **Get two sample fabric photos** (this is the only thing holding up the
   demo buttons): need a clear photo of Denim scrap → save as `frontend/denim.jpg`;
   need a clear photo of Aso-Oke scrap → save as `frontend/aso-oke.jpg`. Then
   wire up the two disabled demo buttons in `index.html` (search for "Coming
   Soon" in the demo fabric panel — change `div` to `button` and call
   `runDemoFabric('denim.jpg')` / `runDemoFabric('aso-oke.jpg')`). Update
   `runDemoFabric()` in `app.js` to accept a filename param.
2. Full browser click-through — auth modal, scan, generate, list, browse
   marketplace (both views), post a request, My Dashboard. No human has done
   this since the redesign.
3. Push to GitHub (`git add -A && git commit -m "..."` + `git push`).
4. Deploy via Render blueprint (see `docs/DEPLOY.md`). Do a warm-up request
   1–2 minutes before the actual demo (Render free tier sleeps).
5. Admin: before the demo, log into `/admin.html`, hit **Pause AI**, let the
   demo audience see the homepage + marketplace, then **Resume AI** when you're
   ready to scan live.

## Decisions log
- Skipping TensorFlow/MobileNet/SQLite — too slow for a 2-day prototype.
- `fal-ai/flux-pro/kontext` is the correct and only viable fal.ai model for
  this use-case (reference-image → product image). Confirmed $0.04/image.
  Cheaper models (flux/dev at $0.025/MP etc.) are text-to-image only.
- Generated images are saved locally to `frontend/generated/<uuid>.jpg`
  immediately after fal.ai returns them. Reason: fal.ai CDN URLs expire in ~1hr.
  Fallback to fal URL if local save fails (graceful degradation).
- `DEMO_SCAN_RESULT` static object in `app.js` for non-logged-in demo: shows
  judges the full product without burning API credit. Real scan runs when signed
  in. Decision: keep it high-quality and realistic so it's genuinely impressive.
- Admin AI gate (`/api/admin/ai-gate`): in-memory toggle (not persisted across
  restarts). Reason: it's a live-demo safety valve, not a permanent setting.
  Restarting the server resets it to "active" which is the safe default.
- Claude cannot browse the internet — it's a vision model, not a browser agent.
  Nigerian fabric/cultural knowledge is baked into the system prompt instead.
  This is sufficient; Claude's training data already knows Nigerian fabrics.
- Supporting materials (By-cotton, airstay, invisible zip, etc.) added to
  Claude prompt as context for product descriptions only — not as scannable
  items. The scan is for fabric scraps, not tailoring supplies.
- `saveUninitialized: true` on session middleware (required — without it no
  session cookie is issued before first write, breaking auth flow).
- fal.ai model for bags: model carrying/holding (not flat-lay). Hats: styled
  on a wooden/marble surface (not on a model head per user preference).
- Waitlist form removed from hero — replaced with two CTAs that open the real
  auth modal or go to the scanner. Having both a waitlist form and a "Sign In"
  button was confusing.
- Marketplace now has two views: "Available Fabric" (listings) and "What
  Designers Need" (requests). Requests board solves the missing "connect
  designers" direction from the original brief.
- `frontend/generated/` added to `.gitignore` — generated images don't belong
  in the repo.

## Open questions / blockers
- **Demo photos needed** (not a blocker for launch, but Denim and Aso-Oke demo
  buttons will remain "Coming Soon" without them). See Next Steps #1.
- fal.ai credit: ~$2.97 (~74 images). Admin should approve accounts carefully
  and use the AI pause gate before public-facing demos.
- In-memory data resets on server restart (listings, accounts, requests). Fine
  for a demo. Render free tier spins down after inactivity — do a warm-up
  request before the demo.
- **Scan/generation history not persisted** (known future issue): when a signed-in
  user scans fabric and generates images, then refreshes the page, all gallery
  cards and scan results are gone. The generated image FILES exist on disk at
  `frontend/generated/uuid.jpg` but nothing links them back to the user's
  account. Solving this requires a database (SQLite is the lightest option) to
  store scan results + product cards + image filenames per userId, and a
  "My Scan History" section in My Dashboard. Not needed for the demo (server
  runs continuously during the pitch) but is a day-1 post-launch priority.
- **Reminder**: never display `server/.env` contents in a chat response. Secrets
  are in `.env` (gitignored). Admin password was shown once in an earlier
  session — change it before the real demo using the command in
  `server/.env.example`.
