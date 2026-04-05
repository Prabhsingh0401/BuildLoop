import { model } from "../lib/gemini.js";
import { parseSynthesisOutput } from "./prompts/synthesis.schema.js";
import { Insight } from "../models/insight.model.js";

import { queryEmbedding } from "../lib/pinecone.js";
import { embedQuery } from "./embedding.service.js";

import AppError from "../utils/AppError.js";

// Stay within safe limits
const MAX_CHARS_PER_CALL = 120_000;

// synthesizeFeedback(projectId)

export async function synthesizeFeedback(projectId) {
  // Step 1 — Embed query
  const vector = await embedQuery("Cluster all user feedback into insights");

  // Step 2 — Fetch from Pinecone
  const matches = await queryEmbedding(vector, "feedback", 100, projectId);

  if (!matches.length) {
    throw new AppError("No feedback found in Pinecone for this project", 404);
  }

  const allChunks = matches.map((m) => m.metadata.text);

  if (!allChunks.length) {
    throw new AppError("Feedback exists but has no usable chunks", 400);
  }

  // Step 3 — Build prompt
  let promptText = allChunks
    .map((chunk, i) => `[CHUNK ${i + 1}]\n${chunk}`)
    .join("\n\n---\n\n");

  if (promptText.length > MAX_CHARS_PER_CALL) {
    promptText = promptText.slice(0, MAX_CHARS_PER_CALL);
    console.warn(`[WARN][synthesis] Truncated input — project: ${projectId}`);
  }

  // Step 4 — Gemini call
  const startTime = Date.now();

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${SYNTHESIS_SYSTEM_PROMPT}

Analyse the following feedback:

${promptText}

Return ONLY a valid JSON array.
Do NOT include explanations.
Do NOT include markdown.`,
          },
        ],
      },
    ],
  });

  const latencyMs = Date.now() - startTime;

  const rawText = result.response.text();

  console.log(`[INFO][synthesis] Gemini response received in ${latencyMs}ms`);

  // Step 5 — Validate with Zod
  const clusters = parseSynthesisOutput(rawText, projectId);

  // Step 6 — Save to Mongo
  await Insight.deleteMany({ projectId });

  const saved = await Insight.insertMany(
    clusters.map((cluster) => ({
      projectId,
      clusterLabel: cluster.clusterLabel,
      summary: cluster.summary,
      sentiment: cluster.sentiment,
      frequency: cluster.frequency,
      representativeQuotes: cluster.representativeQuotes,
    }))
  );

  console.log(`[INFO][synthesis] Saved ${saved.length} clusters — project: ${projectId}`);

  return saved;
}


// SYSTEM PROMPT
const SYNTHESIS_SYSTEM_PROMPT = `You are an expert product analyst specialising in user feedback synthesis.

TASK:
Group feedback into meaningful insight clusters.

RULES:
- clusterLabel must be specific (5-8 words).
- summary: 2-3 sentences explaining impact.
- sentiment: exactly "positive", "negative", or "mixed".
- frequency: number of related chunks.
- representativeQuotes: 2-4 verbatim quotes.
- Produce at least 3 clusters if possible.

IMPORTANT:
- Return ONLY a valid JSON array.
- Do NOT include markdown.
- Do NOT include explanation.

EXAMPLE:
[
  {
    "clusterLabel": "Mobile onboarding takes too many steps",
    "summary": "Users struggle with onboarding complexity...",
    "sentiment": "negative",
    "frequency": 8,
    "representativeQuotes": [
      "I gave up signing up on my phone",
      "Too many steps to register"
    ]
  }
]`;