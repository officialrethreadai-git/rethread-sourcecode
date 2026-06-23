# Design Decisions & Architecture Notes

> Why we built it this way — for future contributors and anyone who wants to
> understand the reasoning behind key technical choices.

---

## Core architecture choices

### Real AI, not faked

We deliberately avoided any mock/simulated AI output. Every scan result and
generated image comes from a real API call. Reasons:

- A demo with hardcoded "confidence: 94.8%" reads as fake to technical judges.
- The actual Claude and fal.ai output is compelling enough on its own.
- Faking it would require maintaining a separate mock layer that diverges from reality.

The tradeoff: real API calls cost real money and take real time (10–30s for
image generation). The wait-time animations and progress messages exist to
make this feel deliberate rather than broken.

### Claude for identification, fal.ai for images

Two separate AI services doing two separate jobs:

- **Claude** (Anthropic) — multimodal vision model. Looks at the fabric photo
  and returns structured JSON: material type, color, condition, hex codes,
  and product suggestions. Very good at identifying Nigerian fabric types
  (Ankara, Aso-Oke, Adire) from training data.
- **fal.ai** (`flux-pro/kontext`) — image-to-image generation. Takes the
  fabric photo as a reference and generates a realistic product photo using
  it. The `kontext` model is the only one capable of reference-image-to-product;
  cheaper text-to-image alternatives couldn't do this.

### In-memory data store

No database for the prototype. Listings, accounts, and sessions live in
Node.js arrays and `express-session`'s MemoryStore.

Reasons: faster to build, zero infrastructure dependencies, easy to reset
between demo runs. The tradeoff (data lost on restart) is acceptable for a
pitch demo where you control the server.

The right next step is SQLite via `better-sqlite3` — single file, no server,
zero configuration, keeps the "one-process, one-deploy" simplicity.

### One Express process serves everything

The Express server serves both the API (`/api/*`) and the static frontend
files. No separate static hosting, no CDN, no build step.

Reasons: simpler deploy (one Render service, one URL, one set of env vars),
no CORS issues between frontend and API, easier to reason about in a small
team. The tradeoff is that the server handles both concerns — acceptable at
this scale.

### Account approval gate

Users sign up → admin approves → then they can scan fabric or generate images.

Reasons: Claude and fal.ai both cost real money per call. The remaining
combined budget (~$8) is small enough that a single user refreshing the page
could exhaust it. The gate protects the budget during a public-facing demo.

The admin also has a "Pause AI" kill-switch to stop all AI calls instantly
without restarting the server — useful immediately before a live pitch when
you don't want random visitors burning credit.

---

## Nigerian-specific design decisions

### Outfit-first product suggestions

The Claude prompt is explicitly instructed to suggest Nigerian garments first
(Ankara wrap dress, Kaftan, Buba & Iro, Senator wear, Agbada) before
suggesting accessories. Accessories (tote bags, bucket hats) are only
suggested when the scrap is genuinely too small for clothing.

Reason: the primary user is a Nigerian tailor. Tailors sew clothing. Suggesting
a tote bag when the user has 1.5m of Ankara is missing the point.

### Nigerian/African model in generated images

fal.ai prompts specify: young Nigerian woman with dark skin and natural hair.
Setting is context-aware — Ankara → modern Lagos studio; Aso-Oke → traditional
ceremony courtyard.

Reason: the platform is for Nigerian users. A generic European model in
generated images would feel wrong and reduce trust.

### Supporting materials awareness

Product descriptions mention the supporting materials the tailor will need
(By-cotton lining, invisible zip, hemming gum etc.) with Lagos market prices.

Reason: knowing "this Ankara dress needs By-cotton lining (~₦1,200) and an
invisible zip (~₦200)" is actionable information a tailor uses immediately.
This differentiates the app from a generic AI tool.

### Fabric education cards

When Claude identifies a fabric type, an info card appears showing origin,
cultural context, and market value. Covered: Ankara, Aso-Oke, Adire, Kente,
George, Guinea Brocade, Hollandaise, Atiku, Velvet, Chiffon, Satin, Lace,
Cotton.

Reason: buyers (fashion students, designers) may not know all Nigerian fabric
types. The cards make the app educational as well as transactional — increases
confidence to buy.

---

## Frontend decisions

### No framework, no bundler

Pure HTML + JS + Tailwind via CDN. No React, no Vite, no build step.

Reason: the existing landing page was already a single HTML file. Adding a
framework would mean migrating existing markup, setting up a bundler,
and adding build complexity — none of which add value for a 2-day prototype.
The tradeoff (no component reuse, no TypeScript) is acceptable at this scale.

### Hand-built component system

CSS classes like `sc-btn`, `sc-input`, `sc-badge` instead of a real UI library.

Reason: shadcn/ui requires React. Tailwind UI requires a license. Building the
minimal set of classes we actually needed took less time than adapting either
to a non-framework context.

### Solid white cards (not glassmorphism)

Original design used translucent blur panels (`backdrop-filter: blur`).
Replaced with solid white `#FFFFFF` cards with real box-shadow.

Reasons: translucent cards read as "Webflow template" to judges. On mobile
in outdoor/bright conditions, low-contrast translucent text is hard to read —
bad for low-literacy users. Solid cards with real shadows look more intentional
and are more accessible.

### Generated images saved locally

When fal.ai returns a generated image URL, the server immediately downloads
the image bytes and saves them to `frontend/generated/<uuid>.jpg`.

Reason: fal.ai CDN URLs expire in ~1 hour. A marketplace listing viewed two
hours after the image was generated would show a broken image. Saving locally
means the image persists as long as the server runs.

### Designer requests board

The marketplace has two views: "Available Fabric" (what tailors have) and
"What Designers Need" (what buyers are looking for).

Reason: the original brief says "connect designers needing those materials."
A one-sided marketplace (only seller listings) only solves half of that. A
requests board closes the loop — a tailor can see demand and list proactively.
