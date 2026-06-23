import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";

import scanRouter from "./routes/scan.js";
import generateRouter from "./routes/generate.js";
import marketplaceRouter from "./routes/marketplace.js";
import adminRouter from "./routes/admin.js";
import accountsRouter from "./routes/accounts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Support both local dev (../../frontend) and Render (RENDER sets cwd to repo root via start cmd)
const staticDir = process.env.STATIC_DIR
  || path.join(__dirname, "../../frontend");

const app = express();
// Trust Render's reverse proxy so secure session cookies work over HTTPS
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(
  session({
    secret: process.env.ADMIN_SESSION_SECRET || "dev-only-insecure-secret",
    resave: false,
    // Must be true: visitors need a persisted session from their first
    // request so the admin can later approve *their specific* session for
    // generate access — without writing to req.session first, no cookie
    // would ever be issued and approvals would have nothing to attach to.
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

app.use("/api/scan", scanRouter);
app.use("/api/generate", generateRouter);
app.use("/api/marketplace", marketplaceRouter);
app.use("/api/admin", adminRouter);
app.use("/api/accounts", accountsRouter);

app.use(express.static(staticDir));

// SPA catch-all: any non-API path serves index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`ReThread AI server running on http://localhost:${port}`);
  console.log(`Serving static files from: ${staticDir}`);
});
