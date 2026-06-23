import { Router } from "express";
import { renderFabricConcept } from "../lib/fal.js";

const router = Router();

router.post("/", async (req, res) => {
  const { imageBase64, mediaType, productName, productDescription, wornByModel } = req.body;

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
    });
    res.json({ imageUrl });
  } catch (err) {
    console.error("[/api/generate] failed:", err);
    res.status(502).json({ error: "Concept render failed", detail: err.message });
  }
});

export default router;
