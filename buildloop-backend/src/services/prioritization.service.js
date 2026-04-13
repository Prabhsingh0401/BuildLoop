import { geminiModel as model } from "../lib/gemini.js";
import { parsePrioritizationOutput } from "./prompts/prioritization.schema.js";
import { Insight } from "../models/insight.model.js";
import { Feature } from "../models/feature.model.js";
import AppError from "../utils/AppError.js";
import validateInsightIds from '../utils/validateInsightIds.js';

// prioritizeInsights(projectId)
export async function prioritizeInsights(projectId) {

  // Step 1 — Fetch insights
  const insights = await Insight.find({ projectId }).lean();

  if (!insights.length) {
    throw new AppError("No insights found. Run synthesis before prioritization.", 404);
  }

  // Step 2 — Format input for Gemini
  const insightSummary = insights
    .map(
      (ins, i) => `INSIGHT ${i + 1}:
Label: ${ins.clusterLabel}
Summary: ${ins.summary}
Sentiment: ${ins.sentiment}
Frequency: ${ins.frequency}`
    )
    .join("\n\n");

  // Step 3 — Gemini call
  const startTime = Date.now();

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${PRIORITIZATION_SYSTEM_PROMPT}\n\nHere are the synthesised insights:\n\n${insightSummary}\n\nReturn ONLY a valid JSON array.\nDo NOT include explanations.\nDo NOT include markdown.`,
          },
        ],
      },
    ],
  });

  const latencyMs = Date.now() - startTime;

  const rawText = result.response.text();

  console.log(`[INFO][prioritize] Gemini response in ${latencyMs}ms`);

  // Step 4 — Validate with Zod
  const features = parsePrioritizationOutput(rawText, projectId);

  // Step 5 — Map insight IDs
  const insightIds = insights.map((ins) => ins._id);

  // Step 6 — Upsert features
  const savedFeatures = [];

  for (const feature of features) {
    feature.insightIds = insightIds;
    if (feature.insightIds && feature.insightIds.length > 0) {
      await validateInsightIds(
        feature.insightIds.map((id) => id.toString())
      );
    }
    const doc = await Feature.findOneAndUpdate(
      { projectId, title: feature.title },
      {
        $set: {
          projectId,
          insightIds,
          title: feature.title,
          priorityScore: feature.priorityScore,
          priorityRationale: feature.priorityRationale,
          effort: feature.effort,
          impact: feature.impact,
        },
        $setOnInsert: {
          status: "backlog",
        },
      },
      { upsert: true, new: true }
    );

    savedFeatures.push(doc);
  }

  // Step 7 — Sort by priority
  savedFeatures.sort((a, b) => b.priorityScore - a.priorityScore);

  console.log(`[INFO][prioritize] Saved ${savedFeatures.length} features — project: ${projectId}`);

  return savedFeatures;
}


// SYSTEM PROMPT
const PRIORITIZATION_SYSTEM_PROMPT = `You are an expert product manager tasked with turning user insights into a prioritised feature backlog.

TASK:
Generate a JSON array of product features based on the insights.

SCORING RULES:
- priorityScore must range from 0–100 (use full range).
- High (67–100): high pain + high frequency + feasible.
- Medium (34–66): moderate importance.
- Low (0–33): low priority or high effort.

- effort and impact must be exactly "low", "medium", or "high".

IMPORTANT:
- Only use provided insights
- Return ONLY valid JSON array
- No explanation
- No markdown

EXAMPLE:
[
  {
    "title": "Streamline mobile onboarding flow",
    "priorityScore": 88,
    "priorityRationale": "High drop-off reported by multiple users",
    "effort": "medium",
    "impact": "high"
  }
]`;