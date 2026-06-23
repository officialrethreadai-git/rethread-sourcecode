import { Router } from "express";
import { renderFabricConcept } from "../lib/fal.js";
import { isCreditExhaustedError, isAuthError } from "../lib/billing.js";

const router = Router();

router.post("/", async (req, res) => {
  if (!req.session?.canGenerate) {
    return res.status(403).json({
      error: "Generate access not approved yet",
      needsAccess: true,
    });
  }

  const { imageBase64, mediaType, productName, productDescription, wornByModel, sizeHint } = req.body;

  if (!imageBase64 || !mediaType || !productName) {
    return res.status(400).json({ error: "imageBase64, mediaType and productName are required" });
  }

  try {
    const imageUrl = await renderFabricConcept({
      imageBase64,
      mediaType,
      productName,
      productDescription,
      wornByModel: Boolean(wornByModel),
      sizeHint: sizeHint || null,
    });
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
