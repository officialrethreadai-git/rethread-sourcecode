# Contributing to ReThread AI

## Project overview

ReThread AI is a fabric-waste recycling marketplace for Nigerian tailors and fashion creators. Tailors upload photos of leftover fabric scraps; the app identifies the material, suggests products to make from it, generates AI concept images, and connects sellers with buyers through a built-in marketplace.

## Tech stack

- **Backend**: Node.js 24, Express, ES modules (`server/`)
- **Frontend**: Vanilla JS, Tailwind CSS via CDN, GSAP, Three.js (`frontend/`)
- **AI services**: Anthropic Claude (fabric analysis), fal.ai (image generation)
- **Deployment**: Render (single Web Service — Express serves both API and static files)

## Local development

### Requirements
- Node.js 18+
- API keys: `ANTHROPIC_API_KEY`, `FAL_KEY`, `FAL_ADMIN_KEY`, `ANTHROPIC_ADMIN_KEY`

### Setup

```bash
cd server
cp .env.example .env
# Fill in your API keys in .env
npm install
npm start
```

App runs at `http://localhost:4000`. Admin panel at `http://localhost:4000/admin.html`.

### Environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude vision API (fabric scanning) |
| `FAL_KEY` | fal.ai image generation |
| `FAL_ADMIN_KEY` | fal.ai billing API |
| `ANTHROPIC_ADMIN_KEY` | Anthropic cost report API |
| `ADMIN_USERNAME` | Admin panel login username |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password |
| `ADMIN_SESSION_SECRET` | Express session secret (any random string) |
| `ANTHROPIC_STARTING_CREDIT_USD` | Starting Claude credit for balance estimation (default: 5) |

Generate a new admin password hash:
```bash
node -e "import('bcryptjs').then(({default:b})=>b.hash('yourpassword',10).then(console.log))"
```

## Project structure

```
server/
  src/
    index.js          # Express app entry point
    routes/           # API route handlers
    lib/              # Shared utilities (AI clients, accounts, billing)
frontend/
  index.html          # Main app
  app.js              # Frontend logic
  style.css           # Component styles
  admin.html          # Admin panel
  admin.js            # Admin panel logic
  assets/             # Sample fabric images for demo buttons
  generated/          # fal.ai generated images (gitignored)
docs/                 # Project documentation
```

## API routes

| Route | Auth | Description |
|---|---|---|
| `POST /api/scan` | Approved account | Scan fabric photo with Claude vision |
| `POST /api/generate` | Approved account | Generate product image with fal.ai |
| `GET /api/marketplace` | Public | Browse listings |
| `GET /api/marketplace/requests` | Public | Browse designer requests |
| `POST /api/marketplace` | Approved account | Post a listing |
| `POST /api/marketplace/:id/reserve` | Approved account | Reserve a listing |
| `GET /api/marketplace/mine` | Logged in | Your listings + reservations |
| `POST /api/accounts/signup` | Public | Create account (pending approval) |
| `POST /api/accounts/login` | Public | Log in |
| `GET /api/admin/accounts` | Admin | List all accounts |
| `POST /api/admin/accounts/:id/approve` | Admin | Approve an account |
| `GET /api/admin/ai-gate` | Admin | Check AI pause state |
| `POST /api/admin/ai-gate` | Admin | Pause/resume AI endpoints |

## Notes

- All data is in-memory (no database). Server restart resets listings, accounts, and sessions. This is intentional for the demo — add SQLite for production persistence.
- Generated images are saved to `frontend/generated/` (gitignored) to prevent fal.ai CDN URL expiry.
- The admin can pause all AI endpoints from `/admin.html` to protect the shared API budget during live demos.
