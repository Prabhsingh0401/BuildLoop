import { z } from "zod";
import AppError from "../../utils/AppError.js";

// Single cluster schema
export const InsightClusterSchema = z.object({
  clusterLabel: z.string().min(3, "clusterLabel must be at least 3 chars"),

  summary: z.string().min(20, "summary must be at least 20 chars"),

  sentiment: z.enum(["positive", "negative", "mixed"], {
    errorMap: () => ({ message: "sentiment must be positive | negative | mixed" }),
  }),

  frequency: z.number().int().min(1),

  representativeQuotes: z.array(z.string().min(5)).min(1).max(5),
});


// Full output schema
export const SynthesisOutputSchema = z.array(InsightClusterSchema).min(1);

// Parser function
export function parseSynthesisOutput(rawText, projectId) {
  // ✅ Better markdown cleanup
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed;

  // JSON parse
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn(`[WARN][synthesis] Invalid JSON from Claude — project: ${projectId}`);
    console.warn(`[WARN][synthesis] Raw output:\n${rawText}`);
    throw new AppError("Claude returned invalid JSON", 500);
  }

  // Ensure array
  if (!Array.isArray(parsed)) {
    console.warn(`[WARN][synthesis] Output is not an array — project: ${projectId}`);
    console.warn(`[WARN][synthesis] Raw output:\n${rawText}`);
    throw new AppError("Claude returned invalid JSON", 500);
  }

  // Zod validation
  const result = SynthesisOutputSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(" | ");

    console.warn(`[WARN][synthesis] Zod failed — project: ${projectId} — ${issues}`);
    console.warn(`[WARN][synthesis] Raw output:\n${rawText}`);

    throw new AppError("Claude returned invalid JSON", 500);
  }

  // Attach projectId (useful for DB)
  return result.data.map((cluster) => ({
    ...cluster,
    projectId,
  }));
}