import { Router } from "express";
import { createRequest, statusForSession } from "../lib/generateAccess.js";

const router = Router();

router.post("/request", (req, res) => {
  const { name } = req.body || {};
  const request = createRequest(name, req.sessionID);
  res.status(201).json({ id: request.id, status: request.status });
});

router.get("/status", (req, res) => {
  res.json({
    canGenerate: !!req.session?.canGenerate,
    requestStatus: statusForSession(req.sessionID),
  });
});

export default router;
