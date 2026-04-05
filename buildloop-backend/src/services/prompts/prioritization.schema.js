import { z } from "zod";
import AppError from "../../utils/AppError.js";


// Feature Schema
export const FeatureSchema = z.object({
  title: z.string().min(3, "title must be at least 3 chars"),

  priorityScore: z
    .number()
    .int()
    .min(0, "priorityScore must be >= 0")
    .max(100, "priorityScore must be <= 100"),

  priorityRationale: z
    .string()
    .min(10, "priorityRationale must be at least 10 chars"),

  effort: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "effort must be low | medium | high" }),
  }),

  impact: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "impact must be low | medium | high" }),
  }),
});


// Full Output Schema
export const PrioritizationOutputSchema = z.array(FeatureSchema).min(1);


// Parser Function
export function parsePrioritizationOutput(rawText, projectId) {
  // Clean markdown fences
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed;

  // JSON parsing
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn(`[WARN][prioritize] Invalid JSON from Claude — project: ${projectId}`);
    console.warn(`[WARN][prioritize] Raw output:\n${rawText}`);
    throw new AppError("Claude returned invalid JSON", 500);
  }

  // Ensure it's an array (extra safety)
  if (!Array.isArray(parsed)) {
    console.warn(`[WARN][prioritize] Output is not an array — project: ${projectId}`);
    console.warn(`[WARN][prioritize] Raw output:\n${rawText}`);
    throw new AppError("Claude returned invalid JSON", 500);
  }

  // Zod validation
  const result = PrioritizationOutputSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(" | ");

    console.warn(`[WARN][prioritize] Zod failed — project: ${projectId} — ${issues}`);
    console.warn(`[WARN][prioritize] Raw output:\n${rawText}`);

    throw new AppError("Claude returned invalid JSON", 500);
  }

  // Final clean data
  return result.data.map((feature) => ({
    ...feature,
    projectId, 
  }));
}