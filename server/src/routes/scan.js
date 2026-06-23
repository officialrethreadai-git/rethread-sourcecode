import { Router } from "express";
import multer from "multer";
import { classifyFabric } from "../lib/anthropic.js";
import { isCreditExhaustedError, isAuthError } from "../lib/billing.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded (field name: image)" });
  }

  try {
    const result = await classifyFabric({
      imageBase64: req.file.buffer.toString("base64"),
      mediaType: req.file.mimetype,
      dimensions: req.body.dimensions,
      weightKg: req.body.weightKg,
      preferredSize: req.body.preferredSize,
    });

    res.json({
      ...result,
      sourceImageBase64: req.file.buffer.toString("base64"),
      sourceMediaType: req.file.mimetype,
    });
  } catch (err) {
    console.error("[/api/scan] failed:", err);
    if (isCreditExhaustedError(err)) {
      return res.status(402).json({
        error: "AI credit exhausted",
        code: "INSUFFICIENT_CREDIT",
        detail: "Claude's API credit has run out. Contact the admin to top it up, then try again.",
      });
    }
    if (isAuthError(err)) {
      return res.status(401).json({
        error: "AI unavailable",
        code: "AI_UNAVAILABLE",
        detail: "The AI service can't be reached right now (API key invalid or revoked). Contact the admin.",
      });
    }
    res.status(502).json({ error: "Fabric scan failed", detail: err.message });
  }
});

export default router;
