import { randomUUID } from "crypto";

// In-memory, resets on server restart — consistent with the rest of this
// prototype's "no DB" scope decision. fal.ai credit is limited, so visitors
// must be approved by the admin before they can call /api/generate.
const requests = [];

export function createRequest(name, sessionID) {
  const existing = requests.find((r) => r.sessionID === sessionID && r.status === "pending");
  if (existing) return existing;

  const request = {
    id: randomUUID(),
    name: name || "Anonymous",
    sessionID,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };
  requests.unshift(request);
  return request;
}

export function listRequests() {
  return requests;
}

export function findRequest(id) {
  return requests.find((r) => r.id === id);
}

export function statusForSession(sessionID) {
  const latest = requests.find((r) => r.sessionID === sessionID);
  return latest ? latest.status : null;
}
