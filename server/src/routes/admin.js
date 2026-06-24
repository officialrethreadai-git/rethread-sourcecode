import { Router } from "express";
import bcrypt from "bcryptjs";
import { getFalBalance, getAnthropicSpend } from "../lib/billing.js";
import { listAccounts, findAccount, deleteAccount } from "../lib/accounts.js";
import { getAiGateState, setAiPaused } from "../lib/aiGate.js";

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

// AI GATE — admin can pause/unpause scan + generate to protect the budget
router.get("/ai-gate", requireAdmin, (_req, res) => {
  res.json(getAiGateState());
});

router.post("/ai-gate", requireAdmin, (req, res) => {
  const { paused } = req.body || {};
  setAiPaused(paused);
  res.json({ ok: true, paused: Boolean(paused) });
});

// ACCOUNT APPROVAL QUEUE — the shared AI budget (fal.ai + Claude) is small,
// so the admin (not every visitor) decides who gets to sign in and use it.
// Approval just flips account.status; the user has to log in (again) to pick
// up an aiApproved session, so there's no need to reach into live sessions.
router.get("/accounts", requireAdmin, (_req, res) => {
  res.json(listAccounts());
});

router.post("/accounts/:id/approve", requireAdmin, (req, res) => {
  const account = findAccount(req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });

  account.status = "approved";
  res.json({ ok: true });
});

router.post("/accounts/:id/deny", requireAdmin, (req, res) => {
  const account = findAccount(req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });

  account.status = "denied";
  res.json({ ok: true });
});

router.delete("/accounts/:id", requireAdmin, (req, res) => {
  const removed = deleteAccount(req.params.id);
  if (!removed) return res.status(404).json({ error: "Account not found" });
  res.json({ ok: true });
});

export default router;
