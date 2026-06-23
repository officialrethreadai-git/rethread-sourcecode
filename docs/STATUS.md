# Status

> Living doc. Updated by `/handoff` at the end of each chat session so a new
> chat can pick up cold. Read this first, then `implementation-plan.md` for
> the architecture.

## Last updated
2026-06-23 — major session: renamed `landingpage-dashboard/` to `frontend/`,
rebuilt the UI with a minimal shadcn-style component system + mobile
hamburger nav, added real drag-and-drop upload, added a single-admin login
with real (not faked) fal.ai/Anthropic credit visibility, added an
admin-approval gate in front of fal.ai image generation to protect the low
remaining budget, added an optional garment-size input, added honest
"credit exhausted" / "AI unavailable" error handling, added wait-time
animations, and added a Render deploy blueprint. This is a team/platoon
project for NYSC camp, not a two-person project — correct any assumption
elsewhere that frames it as just the user + one co-founder.

## Done so far

### Backend (`server/`, Node 24, Express, ES modules)
- `POST /api/scan` — Claude Haiku 4.5 vision call. Returns materialType,
  colorProfile, condition, confidencePercent, suggestedProducts[]. Now also
  accepts an optional `preferredSize` field (e.g. "Medium") that's factored
  into Claude's suggestions and feasibility notes.
- `POST /api/generate` — fal.ai `fal-ai/flux-pro/kontext`. Takes the scrap
  photo + one chosen product idea + optional `sizeHint`, returns a generated
  concept image URL. **Now gated**: requires `req.session.canGenerate`,
  returns `403 {needsAccess:true}` otherwise (see Access control below).
- `GET/POST /api/marketplace` — in-memory listings store.
- `POST /api/generate-access/request`, `GET /api/generate-access/status` —
  public endpoints for a visitor to request/check generate access.
- `POST /api/admin/login`, `/logout`, `GET /api/admin/me` — single
  super-admin session auth (bcrypt password hash, `express-session`).
- `GET /api/admin/balances` — real fal.ai balance (`/v1/account/billing`,
  needs `FAL_ADMIN_KEY`) + real Anthropic spend this month (Cost Report API,
  needs `ANTHROPIC_ADMIN_KEY`) with an estimated-remaining figure computed
  from a configurable starting credit. **No faked numbers**: if a key isn't
  configured, the panel says so and links to the real dashboard instead.
- `GET/POST /api/admin/generate-access[...]` — admin lists pending access
  requests and approves/denies them; approval flips `canGenerate` on the
  *requester's own* server-side session via `req.sessionStore`.
- Express serves `frontend/` statically — one process, one URL.
- Both Claude and fal.ai errors are now classified: insufficient credit
  (`402 INSUFFICIENT_CREDIT`) vs. invalid/revoked key (`401 AI_UNAVAILABLE`),
  each with a user-facing message rather than a raw technical error.

### Frontend (`frontend/`, renamed from `landingpage-dashboard/`)
- Split into `index.html` (markup + tiny inline Tailwind config),
  `style.css`, `app.js` (dashboard/marketplace logic), `admin.js` (admin
  panel logic), `admin.html` (separate admin login + balances page, not
  linked from the main nav).
- **Mobile**: hamburger menu (slide-in sheet) replaces the cramped inline tab
  row below `md` breakpoint; desktop keeps the horizontal tab bar. Marketplace
  grid is 2-up on mobile per explicit request (was 1-up). Reviewed for
  horizontal-overflow risk — none found; `body` also has `overflow-x-hidden`
  as a backstop.
- **Component system**: hand-built minimal shadcn-style classes (`sc-btn`,
  `sc-btn-primary/outline/ghost`, `sc-input`, `sc-badge`) in `style.css` —
  flat, subtle borders, restrained shadows, no React/Radix dependency since
  this is a static-file build with no bundler. Applied to all real buttons
  and inputs (waitlist, dimensions, demo button, generate/list/reserve,
  marketplace refresh).
- **Real Marketplace tab** — `GET /api/marketplace` rendered as browsable
  cards (previously listings could only be posted, never browsed).
- **Real drag-and-drop upload** — the drop-zone previously *looked*
  drag-and-drop-capable but had zero event listeners wired; clicking it did
  nothing outside the small "Browse Files" button. Now wired for real:
  `dragenter/dragover/dragleave/drop` + click-anywhere-in-zone.
- **Optional size input** — `#input-size` next to length/width/weight, flows
  into both `/api/scan` (Claude factors it into suggestions) and
  `/api/generate` (fal.ai prompt includes a sizing hint for worn-by-model
  shots).
- **Generate-access UI** — if `/api/generate` returns `needsAccess`, the card
  swaps its action buttons for an inline "request access" form; after
  requesting, the user sees "ask the admin to approve" and a retry button.
- **Wait-time UX** — scan view cycles through 4 real-status messages while
  Claude analyzes; the generate button's media placeholder gets a shimmer
  animation + 4 cycling captions while fal.ai renders (10-30s), instead of
  sitting frozen.
- **Honest stats**: dashboard's "Scrap Material Scanned / Generated Patterns
  / Circular Revenue" boxes were hardcoded with fake non-zero baselines
  (48.2kg, 14 Drafts, ₦480,000) — reset to honest 0 / ₦0.00.
- **GSAP + ScrollTrigger** (CDN) for landing-page scroll-reveal animations,
  **Three.js** (CDN, r128) for a decorative rotating wireframe icosahedron
  behind the hero. Both feature-detected so a failed CDN load degrades
  silently rather than breaking real app logic. Purely visual, no API cost.

### Admin / access control
- Single super-admin login lives at `/admin.html`, not in the main nav (not
  meant for visitors to find casually). Credentials: `ADMIN_USERNAME` +
  `ADMIN_PASSWORD_HASH` (bcrypt) in `server/.env`. **The initial generated
  password was shown once in chat** (username `admin`) — change it before
  the real demo if you want; regenerate the hash with the command in
  `server/.env.example`.
- fal.ai credit is genuinely low (**$2.97 confirmed live** via the real
  billing API as of this session) — this is why image generation is now
  gated behind admin approval rather than open to every visitor.
- Anthropic has **no live balance API** at all (confirmed via search +
  testing) — only a real Cost Report API (historical spend). The admin panel
  shows real spend-this-month plus an estimated remaining balance computed
  from spend vs. a configurable `ANTHROPIC_STARTING_CREDIT_USD` (default 5),
  clearly labeled as an estimate, never presented as a live number.

### Deployment
- `render.yaml` at repo root — one Web Service (not split static+API, since
  Express already serves both from one process). Secrets are marked
  `sync: false` so they're entered directly in Render's dashboard, never
  committed or pasted into chat.
- `docs/DEPLOY.md` — step-by-step: push to GitHub → Render "New > Blueprint"
  → paste secrets in Render's UI → deploy. No Render API key or MCP needed;
  GitHub-connected Blueprint deploys don't require one.

## In progress
- Nothing mid-way. Server runs via `cd server && npm start`, serves
  `http://localhost:4000` (main app) and `http://localhost:4000/admin.html`
  (admin panel).

## Next steps
1. Manually click through the full flow in an actual browser — verified via
   curl/script that every route returns correctly and the access-approval
   flow works end-to-end (request → admin approves → requester's session
   flips), but no human has clicked through the real UI yet this session.
2. Get real fabric photos (Denim, Aso-Oke, ideally Adire) to replace the two
   disabled "Coming Soon" demo slots with working ones — see the asset
   recommendations given in chat. Drop files in `frontend/assets/`.
3. Get a team/platoon photo (not a "founder duo" — this is an NYSC
   camp/platoon project) for a credibility section if one gets added.
4. Decide on persistence: in-memory marketplace + admin-access requests
   reset on server restart (and on every Render free-tier spin-down/deploy).
   Fine for the demo; flag if judges will restart between runs.
5. Push to GitHub, then deploy via the Render blueprint (`docs/DEPLOY.md`)
   before the actual pitch/demo — free-tier services sleep after inactivity,
   so do a warm-up request a few minutes beforehand.
6. fal.ai credit is very low ($2.97 confirmed) — the generate-access approval
   gate exists specifically to prevent random visitors from burning it during
   a live demo. Approve generously for trusted people, sparingly for anyone
   else.

## Decisions log
- Skipping TensorFlow/MobileNet/local model training and SQLite from the
  original advice — too slow for a 2-day build. Using hosted APIs instead.
- Removed the fake denim/linen/silk presets entirely rather than keep them
  faking results — replaced with one real demo button + explicit
  "Coming Soon" slots.
- `fal-ai/flux-pro/kontext` confirmed as the right fal.ai model for
  fabric→product image generation.
- Split `index.html` into `index.html` + `style.css` + `app.js` (+ later
  `admin.html`/`admin.js`) per explicit user request, rather than one file.
- Added GSAP + Three.js per explicit request ("make it a standard website"),
  kept strictly decorative so a CDN failure can't break real functionality.
- Renamed `landingpage-dashboard/` → `frontend/` per explicit request; updated
  the server's static path and all doc references.
- Built the admin balance panel to show **only real numbers**: fal.ai's
  actual billing API (confirmed working, $2.97), Anthropic's actual Cost
  Report API (no balance API exists for Anthropic at all — confirmed via
  research — so "remaining" is explicitly labeled as an estimate, not a live
  figure). Chose this over faking either number, consistent with the earlier
  decision to remove fake presets/stats.
- Added a generate-access approval system (admin approves who can use
  `/api/generate`) specifically because fal.ai credit is low and the demo
  will be public-facing — protects against accidental/malicious burn-through.
- `saveUninitialized: true` on the session middleware (not `false`) — without
  it, a session is never persisted until something writes to `req.session`,
  which broke the access-approval flow (the admin had nothing to attach an
  approval to). Caught via direct curl testing before it shipped.
- Credit-exhausted vs. invalid-key errors are distinguished server-side
  (`INSUFFICIENT_CREDIT` 402 vs. `AI_UNAVAILABLE` 401) so the user sees an
  accurate, distinct message in either case rather than a generic failure.

## Open questions / blockers
- None currently blocking. fal.ai balance confirmed live at $2.97; Anthropic
  API access confirmed working (no balance API exists, but spend tracking
  does, via the Admin Cost Report API).
- Live secrets pasted directly into chat this session (fal.ai key, fal.ai
  Admin key, Anthropic Admin key) were stored immediately in the gitignored
  `server/.env` and never echoed back — same handling as the original two
  keys. **Reminder for future sessions**: never display `server/.env`
  contents in a chat response.
