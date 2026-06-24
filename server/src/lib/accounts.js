import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

// In-memory, resets on server restart — consistent with this prototype's
// "no DB" scope decision. The shared AI budget (fal.ai + Claude) is small,
// so new accounts must be approved by the admin before they can use it.
const accounts = [];

export async function createAccount(name, email, password) {
  const taken = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (taken) return { error: "An account with that email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  const account = {
    id: randomUUID(),
    name: name || email,
    email,
    passwordHash,
    status: "pending", // pending | approved | denied
    createdAt: new Date().toISOString(),
  };
  accounts.push(account);
  return { account };
}

export async function verifyLogin(email, password) {
  const account = accounts.find((a) => a.email.toLowerCase() === String(email || "").toLowerCase());
  if (!account) return null;
  const matches = await bcrypt.compare(password || "", account.passwordHash);
  return matches ? account : null;
}

export function listAccounts() {
  return accounts
    .map(({ passwordHash, ...rest }) => rest)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function findAccount(id) {
  return accounts.find((a) => a.id === id);
}

export function deleteAccount(id) {
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  accounts.splice(idx, 1);
  return true;
}
