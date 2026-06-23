# ReThread AI — Implementation Plan

## Project
AI-powered fashion-waste recycling marketplace (B2B/B2C), Nigeria-focused.
MVP prototype connecting Nigerian tailors (fabric scrap suppliers) with
designers, students, and upcyclers (buyers).

## AI services
- **fal.ai** (`flux-pro/kontext`) — image generation ($0.04/image)
- **Anthropic Claude** (`claude-haiku-4-5`) — fabric vision analysis

## Current State (updated — see docs/STATUS.md for the live version)
- Full-stack prototype running on `http://localhost:4000`. Express serves
  `frontend/` statically; all API routes under `/api/*`.
- **AI scan** (`POST /api/scan`): Claude Haiku 4.5 vision. Returns materialType,
  colorProfile, condition, confidencePercent, colors[] (with hex codes), and
  suggestedProducts[]. Prompt is size-aware (estimates scrap size from photo),
  color-specific (references actual fabric colors in descriptions), and
  outfit-first for Nigerian fabrics. Includes supporting materials awareness
  (By-cotton, airstay, invisible zip etc. mentioned per product).
- **AI generate** (`POST /api/generate`): fal.ai `flux-pro/kontext` at
  $0.04/image. Cannot be swapped for cheaper models (all cheaper fal.ai options
  are text-to-image only). Generated images saved locally to
  `frontend/generated/<uuid>.jpg` immediately (fal.ai CDN URLs expire ~1hr).
  Nigerian/African model context: Ankara → Lagos studio; Aso-Oke → ceremony
  setting; bags → model carrying; hats → styled flat-lay.
- **Marketplace** (`/api/marketplace`): listings (tailor-posted) + requests
  (designer-posted needs board). Both in-memory. Search/filter on listings
  (client-side). "Post a Request" modal for designers.
- **Accounts** (`/api/accounts`): name + email + password. Admin must approve
  before aiApproved session is granted. Gates both scan and generate.
- **Admin** (`/api/admin`): login, balances (real fal.ai live + Anthropic
  estimate), account approval queue, AI kill-switch (pause/unpause all AI
  endpoints without restarting server).
- **Frontend**: solid white cards (replaced glassmorphism), 44px touch targets,
  solid mint icon chips, hero with plain-English copy + 3-step flow, demo
  without login (static pre-baked Ankara result), fabric education cards (13
  types including Nigerian tailoring knowledge), hex color palette with copy
  button, marketplace with two views (available fabric / designer requests).
- `render.yaml` + `docs/DEPLOY.md` for Render one-blueprint deploy.
- `frontend/generated/` gitignored.

## Architecture Decision
The original advice (TensorFlow/MobileNet trained locally, SQLite, full
in-memory mock "DB") is over-engineered for a 2-day build and includes a fake
confidence-score generator dressed up as a real CV model. Replacing with real,
cheap, hosted AI calls instead — genuinely running server-side, not faked:

1. **Node/Express backend** (minimal, no framework bloat)
2. `POST /api/scan` — accepts an uploaded fabric photo, sends it to **Claude's
   vision API** (multimodal image input) with a prompt asking it to identify
   material type, color, weave/condition, and suggest 2–3 zero-waste products
   with reasoning. This is the real "algorithm running in the backend."
3. `POST /api/generate` — takes the classified fabric + a chosen product idea,
   sends it to **fal.ai** (Flux schnell — cheapest tier) to generate an image of
   the product (or a model wearing it) made from that fabric. This is the
   highest-visual-impact part of the demo.
4. `GET /api/marketplace` — serves listings as JSON (in-memory array is fine for
   a 2-day demo; flat SQLite file only if persistence across restarts matters).
5. **Frontend**: reuse the existing `index.html`. Replace the fake
   `startSimulationAnalysis` function with real `fetch` calls to the endpoints
   above. Keep the existing visual design — it doesn't need a rebuild, just real
   data behind it.

## API Keys Needed
- `ANTHROPIC_API_KEY` — from console.anthropic.com (API platform, **not**
  claude.ai chat).
- `FAL_KEY` — from fal.ai/dashboard/keys.

No OpenAI, no Google Vision, no TensorFlow needed.

## Build Plan
- **Day 1**: Express server scaffolded; both `/api/scan` and `/api/generate`
  tested directly (curl/Postman) end-to-end before touching the UI. Confirm
  actual per-call cost against the $3/$5 budget.
- **Day 2**: Wire the existing dashboard JS to the real endpoints, polish, pick
  a host (Render free tier or similar), deploy.

## Out of Scope for Prototype
- Real payments/escrow integration
- Real user accounts/auth
- Mobile app
- Voice AI assistant
- Locally trained/hosted ML model

## Open Questions / Blockers
- Confirm whether the $5 Claude credit is in console.anthropic.com (usable) or
  a claude.ai subscription (not usable for API calls).
