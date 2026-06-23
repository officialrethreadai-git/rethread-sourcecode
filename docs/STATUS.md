# Project Status

> Living document — updated regularly to reflect the current state of the build.
> Read this first, then `implementation-plan.md` for architecture details.

## Current state

**Deployed at**: https://rethread-ai-sma6.onrender.com  
**Admin panel**: https://rethread-ai-sma6.onrender.com/admin.html  
**Repo**: https://github.com/officialrethreadai-git/rethread-sourcecode

All core features are built and deployed. The app is production-ready for demo and pitch use.

## What's built

### Backend (`server/`, Node 24, Express, ES modules)
- `POST /api/scan` — Claude Haiku 4.5 vision. Identifies material type, color profile, condition, confidence score, dominant colors (with hex codes), and 2–3 product suggestions. Size-aware (estimates scrap size from photo), color-specific descriptions, Nigerian outfit suggestions first. Gated behind approved account.
- `POST /api/generate` — fal.ai `flux-pro/kontext` at $0.04/image. Takes fabric photo + product idea, returns a locally-saved image (`/generated/<uuid>.jpg`). Culturally appropriate Nigerian/African model prompts. Gated behind approved account.
- `GET /api/marketplace` — public listings browse.
- `GET /api/marketplace/requests` — public designer requests board.
- `POST /api/marketplace` — post a listing (approved accounts).
- `POST /api/marketplace/:id/reserve` — reserve a listing (approved accounts, blocks self-reserve and double-reserve).
- `GET /api/marketplace/mine` — logged-in user's own listings, reservations, and requests.
- `POST /api/marketplace/requests` — post a fabric request (approved accounts).
- `POST /api/accounts/signup|login|logout`, `GET /api/accounts/me` — full account system (name, email, password, bcrypt).
- `POST /api/admin/login|logout`, `GET /api/admin/me` — single admin session.
- `GET /api/admin/balances` — real fal.ai credit balance + Anthropic spend estimate.
- `GET/POST /api/admin/ai-gate` — pause/resume all AI endpoints without restarting server.
- `GET /api/admin/accounts`, `POST /api/admin/accounts/:id/approve|deny` — account approval queue.

### Frontend (`frontend/`)
- **4-tab app**: Home (landing), Creator Dashboard (scan/generate), Marketplace, My Dashboard.
- **Auth modal**: sign up / log in popup with pending-approval state. Shows on any gated action.
- **Creator Dashboard**: drag-and-drop upload, fabric dimensions + preferred size inputs, live AI scan with status animations, AI suggestion cards with generate + list buttons, fabric education cards (13 Nigerian/global fabric types), hex color palette with copy-to-clipboard, demo buttons for Ankara / Denim / Aso-Oke.
- **Demo without login**: clicking Sample Ankara shows a full pre-baked result instantly (no API cost) — judges can see the product without signing up.
- **Marketplace**: two views ("Available Fabric" / "What Designers Need"), search + material-type filter on listings, "Post a Request" modal.
- **My Dashboard**: own listings, own reservations, own posted requests.
- **Admin panel** (`/admin.html`): real credit balances, AI kill-switch, account approval queue.
- **Solid white card design**, 44px touch targets, solid mint icon chips, mobile-first.

### Access control
- Accounts require admin approval before `aiApproved` is set on the session.
- Admin can pause ALL AI endpoints from the admin panel (protects budget during live demos).
- fal.ai balance: ~$2.97 (~74 images at $0.04 each).

## Known limitations (acceptable for demo)
- All data is in-memory — resets on server restart. Fine for a demo; add SQLite for production.
- Generated images (`frontend/generated/`) are saved locally on Render's ephemeral disk — lost on redeploy. Use object storage (S3/R2) for production.
- Sessions reset on redeploy (Render free tier) — users must log in again after a new deploy.
- Render free tier sleeps after 15 min inactivity — do a warm-up request before demos.

## Next steps
1. Add SQLite persistence for accounts, listings, and sessions.
2. Integrate real payments (Paystack or Flutterwave for Nigeria).
3. Get more fabric sample photos (Adire, George, Hollandaise) for additional demo buttons.
4. Add WhatsApp share button on marketplace listings.
5. User scan history — persist scan results and generated images per account.
