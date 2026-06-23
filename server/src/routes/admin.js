import { Router } from "express";
import bcrypt from "bcryptjs";
import { getFalBalance, getAnthropicSpend } from "../lib/billing.js";
import { listRequests, findRequest } from "../lib/generateAccess.js";

const router = Router();

export function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  res.status(401).json({ error: "Not authenticated" });
}

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUser || !expectedHash) {
    return res.status(500).json({ error: "Admin login is not configured on the server" });
  }

  const userMatches = username === expectedUser;
  const passwordMatches = password ? await bcrypt.compare(password, expectedHash) : false;

  if (!userMatches || !passwordMatches) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  req.session.isAdmin = true;
  res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get("/me", (req, res) => {
  res.json({ isAdmin: !!req.session?.isAdmin });
});

router.get("/balances", requireAdmin, async (_req, res) => {
  const [fal, anthropic] = await Promise.all([getFalBalance(), getAnthropicSpend()]);
  res.json({ fal, anthropic });
});

// GENERATE-ACCESS APPROVAL QUEUE — fal.ai credit is limited, so the admin
// (not every visitor) decides who can call the image-generation feature.
router.get("/generate-access", requireAdmin, (_req, res) => {
  res.json(listRequests());
});

router.post("/generate-access/:id/approve", requireAdmin, (req, res) => {
  const request = findRequest(req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });

  request.status = "approved";
  req.sessionStore.get(request.sessionID, (err, sessionData) => {
    if (err || !sessionData) return res.status(200).json({ ok: true, warning: "Requester session expired" });
    sessionData.canGenerate = true;
    req.sessionStore.set(request.sessionID, sessionData, () => res.json({ ok: true }));
  });
});

router.post("/generate-access/:id/deny", requireAdmin, (req, res) => {
  const request = findRequest(req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });

  request.status = "denied";
  res.json({ ok: true });
});

export default router;
