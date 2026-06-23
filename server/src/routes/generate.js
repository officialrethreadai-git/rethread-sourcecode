import { Router } from "express";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { renderFabricConcept } from "../lib/fal.js";
import { isCreditExhaustedError, isAuthError } from "../lib/billing.js";
import { isAiPaused } from "../lib/aiGate.js";

const router = Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = join(__dirname, "../../../frontend/generated");

// Download the fal.ai CDN image and save it locally so the URL never expires.
// Falls back to the original fal URL if the download fails (graceful).
async function persistImage(falUrl) {
  try {
    const res = await fetch(falUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = /\.png(\?|$)/i.test(falUrl) ? "png" : "jpg";
    const filename = `${randomUUID()}.${ext}`;
    await mkdir(GENERATED_DIR, { recursive: true });
    await writeFile(join(GENERATED_DIR, filename), buffer);
    return `/generated/${filename}`;
  } catch (err) {
    console.warn("[/api/generate] image save failed, returning fal URL:", err.message);
    return falUrl;
  }
}

router.post("/", async (req, res) => {
  if (!req.session?.aiApproved) {
    return res.status(403).json({
      error: "Sign in to an approved account to generate images",
      needsAuth: true,
    });
  }

  const { imageBase64, mediaType, productName, productDescription, wornByModel, sizeHint, materialType } = req.body;

  if (!imageBase64 || !mediaType || !productName) {
    return res.status(400).json({ error: "imageBase64, mediaType and productName are required" });
  }

  if (isAiPaused()) {
    return res.status(503).json({
      error: "Image generation is temporarily paused by the admin to protect the demo budget. Please wait a moment and try again.",
      code: "AI_PAUSED",
    });
  }

  try {
    const falUrl = await renderFabricConcept({
      imageBase64,
      mediaType,
      productName,
      productDescription,
      wornByModel: Boolean(wornByModel),
      sizeHint: sizeHint || null,
      materialType: materialType || null,
    });

    const imageUrl = await persistImage(falUrl);
    res.json({ imageUrl });
  } catch (err) {
    console.error("[/api/generate] failed:", err);
    if (isCreditExhaustedError(err)) {
      return res.status(402).json({
        error: "AI credit exhausted",
        code: "INSUFFICIENT_CREDIT",
        detail: "fal.ai's image generation credit has run out. Contact the admin to top it up, then try again.",
      });
    }
    if (isAuthError(err)) {
      return res.status(401).json({
        error: "AI unavailable",
        code: "AI_UNAVAILABLE",
        detail: "The image generation service can't be reached right now (API key invalid or revoked). Contact the admin.",
      });
    }
    res.status(502).json({ error: "Concept render failed", detail: err.message });
  }
});

export default router;
