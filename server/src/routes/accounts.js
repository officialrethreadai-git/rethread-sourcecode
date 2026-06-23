import { Router } from "express";
import { createAccount, verifyLogin } from "../lib/accounts.js";

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const { account, error } = await createAccount(name.trim(), email.trim(), password);
  if (error) return res.status(409).json({ error });

  res.status(201).json({ ok: true, status: account.status });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const account = await verifyLogin(email, password);
  if (!account) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (account.status === "pending") {
    return res.status(403).json({ error: "Your account is still awaiting admin approval", status: "pending" });
  }
  if (account.status === "denied") {
    return res.status(403).json({ error: "Your account request was denied. Contact the admin.", status: "denied" });
  }

  req.session.userId = account.id;
  req.session.userName = account.name;
  req.session.aiApproved = true;
  res.json({ ok: true, name: account.name });
});

router.post("/logout", (req, res) => {
  req.session.userId = null;
  req.session.userName = null;
  req.session.aiApproved = false;
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  res.json({
    loggedIn: !!req.session?.userId,
    name: req.session?.userName || null,
    aiApproved: !!req.session?.aiApproved,
  });
});

export default router;
