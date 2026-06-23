# Project Status

> Living document — updated regularly to reflect the current state of the build.
> Read this first, then `implementation-plan.md` for architecture details.

## Last updated
2026-06-23 — deployment session: fixed static file path for Render, fixed
double-backtick syntax error in Claude prompt, added trust proxy for HTTPS
session cookies, wired up Denim + Aso-Oke demo buttons, cleaned all docs
for public release, generated new admin password, admin panel deployed and
accessible.

## Live deployment
**URL**: https://rethread-ai-sma6.onrender.com  
**Admin panel**: https://rethread-ai-sma6.onrender.com/admin.html  
**Admin login**: username `admin`, password `ReThread2026!`  
**Admin password hash** (set in Render env vars):
`$2b$10$RCKJdDOeJhU944A2MIELf.g08zGICkrumuSOO521HeyVm1UOHSAKS`  
**GitHub**: https://github.com/officialrethreadai-git/rethread-sourcecode  
**Latest commit**: `25eadd4`

## What's built

### Backend (`server/`, Node 24, Express, ES modules)
- `POST /api/scan` — Claude Haiku 4.5 vision. Returns materialType,
  colorProfile, condition, confidencePercent, colors[] (name+hex+role),
  suggestedProducts[]. Size-aware, color-specific, outfit-first for Nigerian
  fabrics. Supporting materials awareness (By-cotton, airstay, invisible zip
  etc.). Gated behind `req.session.aiApproved`. Also checks `isAiPaused()`.
- `POST /api/generate` — fal.ai `flux-pro/kontext` at $0.04/image.
  Saves image locally to `frontend/generated/<uuid>.jpg` (fal CDN URLs
  expire ~1hr). Nigerian/African model context: Ankara → Lagos studio;
  Aso-Oke → ceremony; bags → model carrying; hats → styled flat-lay.
  Checks `isAiPaused()`.
- `GET /api/marketplace` — public listings browse.
- `GET /api/marketplace/requests` — public designer requests board (3 seed
  requests). `POST /api/marketplace/requests` (aiApproved) to add new.
- `POST /api/marketplace` — list an item (aiApproved).
- `POST /api/marketplace/:id/reserve` — claim listing (aiApproved, blocks
  self-reserve + double-reserve).
- `GET /api/marketplace/mine` — own listings + reservations + posted requests.
- `POST /api/accounts/signup|login|logout`, `GET /api/accounts/me`.
- `POST /api/admin/login|logout`, `GET /api/admin/me`.
- `GET /api/admin/balances` — real fal.ai balance + Anthropic spend.
- `GET/POST /api/admin/ai-gate` — pause/resume all AI without restart.
- `GET /api/admin/accounts`, `POST /api/admin/accounts/:id/approve|deny`.
- `app.set("trust proxy", 1)` — required for HTTPS session cookies on Render.
- `express.static(staticDir)` + SPA catch-all for non-API GET routes.
- Static path uses `process.env.STATIC_DIR` override or `../../frontend`
  from `server/src/`.

### Frontend (`frontend/`)
- 4-tab app: Home, Creator Dashboard, Marketplace, My Dashboard.
- Auth modal (signup/login/pending states). Nav shows Hi,{name} + Sign Out.
- Creator Dashboard: drag-and-drop upload, dimensions + size inputs, scan
  animations, suggestion cards with generate + list buttons, fabric education
  cards (13 types), color palette with copy-hex, demo buttons (Ankara/Denim/
  Aso-Oke — all three now wired with real sample photos in `frontend/assets/`).
- Demo without login: Ankara sample shows pre-baked result instantly, Denim/
  Aso-Oke prompt sign-in (no pre-baked result for those).
- Marketplace: two views (Available Fabric / What Designers Need), search +
  material filter, Post a Request modal.
- My Dashboard: own listings, reservations, posted requests.
- Admin panel: real credit balances (Anthropic note simplified — just shows
  spend, no technical explanation), AI kill-switch, account approval queue.
- Solid white cards, 44px touch targets, solid mint icon chips, mobile-first.

### Render deployment config
- Root Directory: **blank** (repo root, NOT `server`)
- Build Command: `cd server && npm install`
- Start Command: `cd server && npm start`
- Required env vars: `ANTHROPIC_API_KEY`, `FAL_KEY`, `FAL_ADMIN_KEY`,
  `ANTHROPIC_ADMIN_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`,
  `ADMIN_SESSION_SECRET`, `ANTHROPIC_STARTING_CREDIT_USD=5`, `NODE_ENV=production`

## In progress
- Render MCP server not yet configured — user attempted `claude mcp add`
  from cmd.exe (doesn't work). Must run from VS Code integrated terminal:
  ```
  claude mcp add --transport http render https://mcp.render.com/mcp --header "Authorization: Bearer <NEW_API_KEY>"
  ```
  Note: the API key `rnd_xk7FxREItUAOcUgJ8N1K5DRkyQm6` was exposed in chat
  and should be revoked. Create a new key from Render Account Settings first.
- Admin login on Render may still show 401 if `ADMIN_PASSWORD_HASH` env var
  hasn't been saved yet. Use hash above. Clear browser cookies after updating.

## Next steps
1. **Verify admin login works** on Render after env var update + redeploy.
   Clear browser cookies for `rethread-ai-sma6.onrender.com` first.
2. **Revoke the Render API key** exposed in chat (`rnd_xk7FxREItUAOcUgJ8N1K5DRkyQm6`)
   and create a fresh one from Render Account Settings if you want to use MCP.
3. **Add SQLite persistence** — accounts, listings, and sessions all reset on
   server restart. `better-sqlite3` is the lightest option. See
   `docs/design-decisions.md` for context.
4. **Add real payments** — Paystack or Flutterwave for Nigeria.
5. **Add user scan history** — persist scan results + generated image filenames
   per userId so users can see past scans after refresh.

## Decisions log
- `app.set("trust proxy", 1)` added to `server/src/index.js` — required for
  Render's HTTPS reverse proxy to set secure session cookies correctly.
  Without it, `secure: true` cookies are blocked because Express sees the
  connection as HTTP (the proxy→app leg).
- Render Root Directory must be **blank** (not `server`) so the full repo is
  accessible. Build/start commands use `cd server &&` prefix instead. With
  Root Directory = `server`, the `frontend/` folder is outside the working
  directory and `express.static("../../frontend")` silently resolves to a
  non-existent path.
- SPA catch-all added (`app.get(/^(?!\/api).*/, ...)`) — serves `index.html`
  for any non-API GET path, preventing "Not Found" on direct URL access.
- `STATIC_DIR` env var override added to `server/src/index.js` as an escape
  hatch if the path ever needs to differ per environment.
- Admin Anthropic card simplified — removed "not a live balance (Anthropic
  doesn't expose one)" note. Now just shows spend amount cleanly.
- All docs rewritten for public release — `docs/prompts-used.md` converted to
  `docs/design-decisions.md` (architecture rationale), `docs/STATUS.md`
  and `docs/implementation-plan.md` cleaned of internal session language,
  `CLAUDE.md` simplified to quick-start pointer, `CONTRIBUTING.md` added.
- Denim + Aso-Oke demo buttons wired up — assets are in `frontend/assets/`.
  `runDemoFabric(filename)` now accepts a filename param. Non-logged-in users
  clicking Denim/Aso-Oke see the auth modal (only Ankara shows the pre-baked
  demo result).
- Double backtick syntax error fixed in `server/src/lib/anthropic.js` line 53
  — `SPECIALIST — ...eyelets.``; ` had two closing backticks, causing the
  template literal to end early and crash the server on Render.

## Open questions / blockers
- **Admin 401 may persist** until `ADMIN_PASSWORD_HASH` env var is updated on
  Render AND browser cookies are cleared. Password: `ReThread2026!`.
- **Render API key exposed in chat** — revoke `rnd_xk7FxREItUAOcUgJ8N1K5DRkyQm6`
  before the repo goes public.
- **In-memory data resets on every Render redeploy** — fine for demo, must
  fix before real users. See Next Steps #3.
- **fal.ai credit**: ~$2.97 (~74 images at $0.04). Use AI pause gate in admin
  panel before public-facing demos.
- **Render free tier sleeps after 15 min inactivity** — do a warm-up request
  1–2 min before any demo.
- **Git history has AI attribution** (`Co-Authored-By: Claude Sonnet 4.6`) on
  every commit — visible on GitHub. Rewriting history would require force-push
  and is risky. Note this before making repo public.
- **Reminder**: never display `server/.env` contents in chat.
