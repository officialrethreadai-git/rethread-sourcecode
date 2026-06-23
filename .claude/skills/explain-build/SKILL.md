---
name: explain-build
description: Generate or refresh a plain-English explainer of the current ReThread AI build for a non-technical audience (the user's girlfriend, pitch co-founder, judges). Use when asked to "explain what we built", "show her how this works", or similar.
---

Write or update `docs/PLAIN-ENGLISH-GUIDE.md` so a non-technical person — the user's girlfriend, who is the pitch co-founder and presented the business plan but isn't a developer — can understand exactly what exists right now and how it works, with zero jargon.

Match the tone and structure of the "Understanding guide" the user already wrote for the business plan (simple word substitutions, short plain sentences, real-world analogies like "hosting is like putting your website on the internet so people can visit it like Instagram"). Do not write a technical README — she should be able to read this and explain the demo to a judge herself.

## Steps

1. Read the actual current state of the project before writing anything:
   - `server/src/index.js` and `server/src/routes/*.js` for what the backend really does
   - `landingpage-dashboard/index.html` for what's wired up vs. still a "Coming Soon" placeholder
   - `docs/STATUS.md` for what's been built so far this session
   Do not describe planned-but-unbuilt features as if they exist.

2. Write `docs/PLAIN-ENGLISH-GUIDE.md` with these sections:
   - **What this is** — one paragraph, no jargon, same spirit as the business plan's "Simple Purpose" section.
   - **What happens when someone uses it** — walk through the actual user flow step by step in plain language (e.g. "1. You take a photo of a fabric scrap and type in its size and weight. 2. The photo gets sent to Claude, which is Anthropic's AI — think of it like showing the photo to an expert tailor who instantly tells you what fabric it is..."). Only describe steps that are actually implemented.
   - **The two AI services we use, explained simply** — Claude (the "expert tailor who looks at the photo and identifies it") and fal.ai (the "AI artist who draws what the finished product would look like"). Explain why two different ones, in cost/capability terms a non-engineer can follow.
   - **What's real vs. what's a placeholder** — an honest, explicit list. Anything marked "Coming Soon" in the UI must be listed as not-yet-built here too, so she never overclaims to a judge.
   - **Words she might get asked about** — a short glossary, same style as the original guide (API, backend, endpoint, etc.), but only for terms that actually appear in this build.

3. Keep it short enough to read in 5 minutes. Prefer concrete examples over abstractions.

4. After writing, reply with a one-line confirmation of what was updated — do not paste the whole doc back into chat.
