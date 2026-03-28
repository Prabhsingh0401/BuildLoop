import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const MODEL = "voyage-3";
const BATCH_SIZE = 64;
const EXPECTED_DIM = 1024;

// embed() 
// Converts multiple text chunks → vectors

export async function embed(chunks) {
  if (chunks.length === 0) return [];

  const allVectors = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    // Call Voyage API directly
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: batch,
        input_type: "document",
      }),
    });

    const data = await res.json();
    const batchVectors = data.data.map((item) => item.embedding);

    // Safety check
    for (const vec of batchVectors) {
      if (vec.length !== EXPECTED_DIM) {
        throw new Error(
          `Expected ${EXPECTED_DIM}-dim vector, got ${vec.length}`
        );
      }
    }

    // Merge all batches
    allVectors.push(...batchVectors);
  }

  return allVectors;
}

// embedQuery() 
// Converts a query → vector (used for search)

export async function embedQuery(query) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [query],
      input_type: "query",
    }),
  });

  const data = await res.json();
  const vector = data.data[0].embedding;

  if (vector.length !== EXPECTED_DIM) {
    throw new Error(
      `Expected ${EXPECTED_DIM}-dim vector, got ${vector.length}`
    );
  }

  return vector;
}