import { Router } from "express";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { classifyFabric } from "../lib/anthropic.js";
import { isCreditExhaustedError, isAuthError } from "../lib/billing.js";
import { isAiPaused } from "../lib/aiGate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = join(__dirname, "../../../frontend/generated");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

async function persistFabricImage(buffer, mimetype) {
  try {
    const ext = mimetype === "image/png" ? "png" : "jpg";
    const filename = `fabric-${randomUUID()}.${ext}`;
    await mkdir(GENERATED_DIR, { recursive: true });
    await writeFile(join(GENERATED_DIR, filename), buffer);
    return `/generated/${filename}`;
  } catch (err) {
    console.warn("[/api/scan] fabric image save failed:", err.message);
    return null;
  }
}

router.post("/", upload.single("image"), async (req, res) => {
  if (!req.session?.aiApproved) {
    return res.status(403).json({
      error: "Sign in to an approved account to scan fabric",
      needsAuth: true,
    });
  }
  if (isAiPaused()) {
    return res.status(503).json({
      error: "AI scanning is temporarily paused by the admin to protect the demo budget. Please wait a moment and try again.",
      code: "AI_PAUSED",
    });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded (field name: image)" });
  }

  try {
    const [result, fabricImageUrl] = await Promise.all([
      classifyFabric({
        imageBase64: req.file.buffer.toString("base64"),
        mediaType: req.file.mimetype,
        dimensions: req.body.dimensions,
        weightKg: req.body.weightKg,
        preferredSize: req.body.preferredSize,
      }),
      persistFabricImage(req.file.buffer, req.file.mimetype),
    ]);

    res.json({
      ...result,
      sourceImageBase64: req.file.buffer.toString("base64"),
      sourceMediaType: req.file.mimetype,
      fabricImageUrl,
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
