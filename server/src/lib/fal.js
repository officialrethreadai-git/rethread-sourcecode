import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

// Determine the right photography/model context for the garment + fabric type.
// For a Nigerian platform the model and setting must reflect Nigerian fashion culture.
function buildSubject(productName, materialType, sizeHint, wornByModel) {
  const name = (productName || "").toLowerCase();
  const material = (materialType || "").toLowerCase();

  // Bags and purses — Nigerian woman carrying/holding it (not wearing)
  const isBag = /bag|tote|purse|clutch|pouch|satchel/i.test(name);
  if (isBag) {
    return `held/carried by a stylish young Nigerian woman with dark skin and natural hair, street fashion shot, Lagos style, clean background, e-commerce quality. The bag must be clearly visible.`;
  }

  // Hats and headwear — styled on a surface, not always on a model head
  const isHat = /hat|cap|beret|bucket hat|headwear/i.test(name);
  if (isHat) {
    return `styled on a clean wooden table or marble surface, soft natural side lighting, e-commerce flat-lay. The fabric pattern and hat shape must be clearly visible.`;
  }

  // Non-clothing items — flat-lay
  if (!wornByModel) {
    return "as a clean product flat-lay shot on a warm wooden surface, soft natural lighting, e-commerce quality";
  }

  const isTraditional =
    /aso.?oke|adire|agbada|iro.*(buba)?|buba.*(iro)?|gele|boubou|kaftan|senator/i.test(name) ||
    /aso.?oke|adire/i.test(material);

  const isAnkara = /ankara|wax.?print/i.test(name + " " + material);

  const sizeDesc = sizeHint ? `, sized for ${sizeHint}` : "";

  if (isTraditional) {
    return `worn by a confident young Nigerian woman with dark skin and natural hair, full body${sizeDesc}, traditional Nigerian ceremony setting — warm outdoor courtyard with soft golden light, rich colours, high-fashion editorial style. The garment details must be clearly visible.`;
  }

  if (isAnkara) {
    return `worn by a stylish young Nigerian woman with dark skin and natural hair, full body${sizeDesc}, modern Lagos fashion photography — clean studio background with warm tones, vibrant West African fashion editorial style. Bold and confident pose. The fabric pattern and garment cut must be clearly visible.`;
  }

  return `worn by a young Nigerian woman with dark skin, full body${sizeDesc}, clean studio background, soft warm lighting, contemporary West African fashion photography style. The garment must be clearly visible and well-fitted.`;
}

export async function renderFabricConcept({
  imageBase64,
  mediaType,
  productName,
  productDescription,
  wornByModel,
  sizeHint,
  materialType,
}) {
  const buffer = Buffer.from(imageBase64, "base64");
  const blob = new Blob([buffer], { type: mediaType });
  const imageUrl = await fal.storage.upload(blob);

  const subject = buildSubject(productName, materialType, sizeHint, wornByModel);

  const sizeText = sizeHint ? ` Sized for: ${sizeHint}.` : "";

  const prompt = `Transform this fabric swatch into a professional, photorealistic photo of: ${productName}. ${
    productDescription || ""
  }${sizeText} Preserve the fabric's exact color, pattern and texture from the reference image. Shown ${subject}. E-commerce quality, high detail, sharp focus.`;

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
