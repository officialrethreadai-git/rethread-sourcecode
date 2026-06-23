# ReThread AI — Implementation Plan

## Project
AI-powered fashion-waste recycling marketplace (B2B/B2C), Nigeria-focused.
Prototype/MVP for a pitch competition. Timeline: ~2 days.

## Budget
- $3 credit on **fal.ai** (image generation)
- $5 credit on **Claude** — location to be confirmed: console.anthropic.com (API
  platform, usable for this build) vs. claude.ai subscription credit (NOT usable
  for API calls). Confirm before relying on it.

## Current State (updated — see docs/STATUS.md for the live version)
- Backend built and working: `server/` (Express, Node 24, ES modules).
  `/api/scan` (Claude Haiku 4.5 vision), `/api/generate` (fal.ai
  flux-pro/kontext, gated by admin approval), `/api/marketplace` (in-memory),
  `/api/admin/*` (single super-admin login + real credit balances),
  `/api/generate-access/*` (request/approve flow) all tested end-to-end with
  real keys and real responses.
- `frontend/` (renamed from `landingpage-dashboard/`) is wired to the real
  backend — no more `setTimeout`/`mockPatterns`. Split into
  `index.html`/`style.css`/`app.js` (+ `admin.html`/`admin.js` for the admin
  panel). The Express server serves the whole folder statically as one
  process on `http://localhost:4000`.
- Mobile-first responsive pass: hamburger nav sheet below `md`, 2-up
  marketplace grid on mobile, hand-built shadcn-style component classes
  (`sc-btn`/`sc-input`/`sc-badge`) for a flat, minimal look without a
  React/Radix dependency.
- Dimension (length/width/weight) + optional preferred-size input fields,
  all flowing into both the Claude prompt and the fal.ai generation prompt.
- A real bundled demo photo (`img.jpg`, Ankara print) runs through the actual
  AI pipeline via the "Sample Ankara" button — not a fake preset.
- "Coming Soon" roadmap grid added to the dashboard, matching the business
  plan's future-features list, so nothing unbuilt is presented as real.
- Image generation is gated: visitors request access, the admin (logged in
  at `/admin.html`) approves/denies per-session — protects the low fal.ai
  budget from being burned by random visitors during a public demo.
- `docs/PLAIN-ENGLISH-GUIDE.md` + `.claude/skills/explain-build/` give a
  non-technical walkthrough of the actual current build.
- `render.yaml` + `docs/DEPLOY.md` for a one-blueprint Render deploy.

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
