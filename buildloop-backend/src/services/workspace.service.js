import { model } from "../lib/gemini.js";
import { embedQuery } from "./embedding.service.js";
import { queryEmbedding } from "../lib/pinecone.js";
import AppError from "../utils/AppError.js";

// askWorkspace({ projectId, question, messages })
export async function askWorkspace({ projectId, question, messages = [] }) {

  if (!question?.trim()) {
    throw new AppError("Question cannot be empty", 400);
  }

  // Step 1 — Embed question
  const queryVector = await embedQuery(question);

  // Step 2 — Pinecone search (FIXED: added projectId)
  const matches = await queryEmbedding(queryVector, "workspace", 6, projectId);

  // Step 3 — Build context
  const codeContext = matches.length
    ? matches
        .map(
          (match, i) =>
            `[SOURCE ${i + 1}] File: ${match.metadata?.fileName ?? "unknown"} | Language: ${match.metadata?.language ?? "unknown"}
\`\`\`
${match.metadata?.text ?? ""}
\`\`\``
        )
        .join("\n\n")
    : "No relevant code found.";

  // Step 4 — Build system prompt
  const systemPrompt = buildWorkspaceSystemPrompt(codeContext);

  // Step 5 — Format conversation history
  const historyText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  // Step 6 — Gemini call
  const startTime = Date.now();

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}

Conversation History:
${historyText}

User Question:
${question}

Answer clearly using ONLY the provided code context.`,
          },
        ],
      },
    ],
  });

  const latencyMs = Date.now() - startTime;

  const answer = result.response.text();

  console.log(`[INFO][workspace] Gemini response in ${latencyMs}ms`);

  // Step 7 — Build citations
  const citations = matches.map((match, i) => ({
    sourceIndex: i + 1,
    fileName: match.metadata?.fileName ?? "unknown",
    language: match.metadata?.language ?? "unknown",
    excerpt: (match.metadata?.text ?? "").slice(0, 200).trim(),
    score: match.score ?? 0,
  }));

  return { answer, citations };
}

// System Prompt
function buildWorkspaceSystemPrompt(codeContext) {
  return `You are an expert software engineer helping a developer understand their codebase.

GROUNDED CONTEXT (use ONLY this code):
${codeContext}

RULES:
- Answer ONLY using the code above.
- Do NOT hallucinate functions or APIs.
- If not found, say "Not found in provided code".
- Reference sources using [SOURCE N].
- Keep answers concise and developer-friendly.`;
}