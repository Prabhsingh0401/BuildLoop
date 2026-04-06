import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const MODEL = "voyage-3";
const BATCH_SIZE = 64;
const EXPECTED_DIM = 1024;


// ✅ RATE LIMIT FUNCTION
let lastCallTime = 0;

async function rateLimit() {
  const now = Date.now();
  const diff = now - lastCallTime;

  if (diff < 20000) { // 20 seconds gap
    await new Promise(r => setTimeout(r, 20000 - diff));
  }

  lastCallTime = Date.now();
}


// ✅ RETRY FUNCTION
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);

    if (res.ok) return res;

    const text = await res.text();

    if (res.status === 429) {
      console.warn("429 hit → retrying...");
      await new Promise(r => setTimeout(r, 5000));
    } else {
      throw new Error(text);
    }
  }

  throw new Error("Max retries reached");
}


// embed()
// Converts multiple text chunks → vectors
export async function embed(chunks) {
  if (!chunks || chunks.length === 0) return [];

  const allVectors = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    // ✅ RATE LIMIT ADDED
    await rateLimit();

    // ✅ RETRY LOGIC ADDED
    const res = await fetchWithRetry("https://api.voyageai.com/v1/embeddings", {
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

    // Response validation
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error("Invalid Voyage response in embed()");
    }

    const batchVectors = data.data.map((item) => item.embedding);

    // Dimension check
    for (const vec of batchVectors) {
      if (!vec || vec.length !== EXPECTED_DIM) {
        throw new Error(
          `Expected ${EXPECTED_DIM}-dim vector, got ${vec?.length}`
        );
      }
    }

    allVectors.push(...batchVectors);
  }

  return allVectors;
}


// embedQuery()
// Converts a query → vector (used for search)
export async function embedQuery(query) {
  if (!query || typeof query !== "string") {
    throw new Error("embedQuery() requires a valid string input");
  }

  // ✅ RATE LIMIT ADDED
  await rateLimit();

  // ✅ RETRY LOGIC ADDED
  const res = await fetchWithRetry("https://api.voyageai.com/v1/embeddings", {
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

  // Strong validation
  if (!data || !data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error("Invalid Voyage response in embedQuery()");
  }

  const vector = data.data[0].embedding;

  // Dimension check
  if (!vector || vector.length !== EXPECTED_DIM) {
    throw new Error(
      `Expected ${EXPECTED_DIM}-dim vector, got ${vector?.length}`
    );
  }

  return vector;
}