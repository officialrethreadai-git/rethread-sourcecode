import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

export async function renderFabricConcept({
  imageBase64,
  mediaType,
  productName,
  productDescription,
  wornByModel,
}) {
  const buffer = Buffer.from(imageBase64, "base64");
  const blob = new Blob([buffer], { type: mediaType });
  const imageUrl = await fal.storage.upload(blob);

  const subject = wornByModel
    ? `worn by a fashion model, full body, studio lighting`
    : `as a clean product flat-lay shot, studio lighting`;

  const prompt = `Transform this fabric swatch into a professional, photorealistic product photo of: ${productName}. ${
    productDescription || ""
  } Preserve the fabric's exact color, pattern and texture from the reference image. Shown ${subject}. E-commerce quality, high detail.`;

  const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
    input: { prompt, image_url: imageUrl },
    logs: false,
  });

  const generated = result.data?.images?.[0]?.url;
  if (!generated) {
    throw new Error("fal.ai returned no image");
  }

  return generated;
}
