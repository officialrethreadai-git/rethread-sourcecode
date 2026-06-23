import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the textile analysis engine for ReThread AI, a Nigerian fabric-waste marketplace. Analyze the uploaded fabric scrap photo and respond with STRICT JSON only — no markdown fences, no commentary — matching exactly this schema:

{
  "materialType": string,
  "colorProfile": string,
  "condition": string,
  "confidencePercent": number,
  "suggestedProducts": [
    { "name": string, "description": string, "estimatedValueNaira": number, "yieldPercent": number }
  ]
}

Suggest 2-3 suggestedProducts. Favor zero-waste, low-complexity products realistic for a small tailor to actually cut (tote bags, bucket hats, scarves, patchwork panels, bandanas) over full garments unless the scrap is clearly large enough. Recognize Nigerian fabric types (Ankara, Aso-Oke, Adire) when visible. If scrap dimensions or weight are provided, factor them into feasibility and the estimatedValueNaira.`;

export async function classifyFabric({ imageBase64, mediaType, dimensions, weightKg, preferredSize }) {
  const dimensionText = dimensions
    ? `Scrap dimensions: ${dimensions}.`
    : "No dimensions provided.";
  const weightText = weightKg ? `Weight: ${weightKg}kg.` : "No weight provided.";
  const sizeText = preferredSize
    ? `The person wants something sized for: ${preferredSize}. Only suggest products that are realistically achievable at this size given the scrap's dimensions — say so in the description if the scrap is too small for that size.`
    : "No preferred wearer size given.";

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          { type: "text", text: `${dimensionText} ${weightText} ${sizeText}` },
        ],
      },
    ],
  });

  const raw = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  const jsonText = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();

  return JSON.parse(jsonText);
}
