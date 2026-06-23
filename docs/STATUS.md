# Status

> Living doc. Updated by `/handoff` at the end of each chat session so a new
> chat can pick up cold. Read this first, then `implementation-plan.md` for
> the architecture.

## Last updated
2026-06-23 — full backend built and wired to the frontend; real AI calls
confirmed working end-to-end.

## Done so far
- Real API keys received and stored in `server/.env` (gitignored, never
  echoed in chat).
- Built `server/` (Node 24, Express, ES modules):
  - `POST /api/scan` — Claude Haiku 4.5 vision call, returns materialType,
    colorProfile, condition, confidencePercent, suggestedProducts[].
  - `POST /api/generate` — fal.ai `fal-ai/flux-pro/kontext`, takes the scrap
    photo + a product idea, returns a generated concept image URL.
  - `GET/POST /api/marketplace` — in-memory listings store.
  - Express also serves `landingpage-dashboard/` statically, so the whole
    app is one process on `http://localhost:4000`.
- Hit and fixed a real bug: `@anthropic-ai/sdk@0.32.1` used a bundled
  `node-fetch` that threw `ERR_STREAM_PREMATURE_CLOSE` on gzip responses in
  this environment. Upgraded to `@anthropic-ai/sdk@^0.105.0` (uses native
  fetch) — fixed it. If this resurfaces, it's an SDK/runtime fetch issue, not
  a key or network problem (native `fetch` and direct `curl` both always
  worked).
- Verified both endpoints live: `/api/scan` correctly identified the bundled
  `img.jpg` as Ankara cotton print with 92% confidence and 3 sensible product
  suggestions; `/api/generate` produced a genuinely good studio product photo
  of a tote bag from that fabric (fal-ai/flux-pro/kontext confirmed to work
  well for "turn this fabric into a product photo / model wearing it").
- Wired `landingpage-dashboard/index.html` to the real backend — removed all
  `setTimeout`/`mockPatterns` fake logic. Added length/width/weight input
  fields. Replaced the 3 fake material presets with one real "Sample Ankara"
  demo button (runs the actual bundled photo through the real pipeline) + 2
  honest "Coming Soon" slots. Added a live scan-summary banner and a
  "Coming Soon" roadmap grid (8 features from the business plan).
  Verified inline JS passes `node --check` syntax validation.
- Created `.claude/skills/explain-build/` (girlfriend-facing plain-English
  explainer skill) and generated `docs/PLAIN-ENGLISH-GUIDE.md` from it.
- Created `docs/prompts-used.md` documenting the cumulative prompting that
  produced this build, for submission/transparency purposes.

## In progress
- Nothing mid-way. Server was last left running in the background on port
  4000 (`server/` via `npm start`) for testing — may need a restart in a
  fresh session.

## Next steps
1. Manually test the full flow in an actual browser at
   `http://localhost:4000` (upload, demo button, generate image, list &
   sell) — everything above was verified via curl/script, not a real browser
   yet.
2. Decide on persistence: in-memory marketplace resets on server restart.
   Fine for the demo; flag if judges will restart the server between runs.
3. Pick a deploy target (Render free tier or similar) and deploy before the
   pitch.
4. Consider trimming `@fal-ai/client` cost/quality tradeoff — only one real
   generation has been tested against the $3 budget so far; do a couple more
   to confirm the budget holds for live demo + judge testing.

## Decisions log
- Skipping TensorFlow/MobileNet/local model training and SQLite from the
  original advice — too slow for a 2-day build. Using hosted APIs instead.
- Keeping the existing `index.html` visual design/accent as-is; only
  replacing the fake JS logic with real fetch calls.
- Removed the fake denim/linen/silk presets entirely rather than keep them
  faking results — they all would have used the same single bundled photo
  and returned mismatched labels, which would look dishonest in front of
  judges. Replaced with one real demo button + explicit "Coming Soon" slots.
- `fal-ai/flux-pro/kontext` confirmed as the right fal.ai model for
  fabric→product image generation (reference image + text instruction,
  preserves color/pattern well).

## Open questions / blockers
- None currently blocking. ($5 Claude credit confirmed working via direct
  API call.)
