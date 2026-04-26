import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

// ENV VALIDATION
if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set. Add it to your .env file.");
}
if (!process.env.PINECONE_INDEX) {
  throw new Error("PINECONE_INDEX is not set. Add the index name to your .env file.");
}

const VALID_NAMESPACES = ["feedback", "workspace"];
const EXPECTED_VECTOR_DIM = 1024;

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

export const index = pinecone.index(process.env.PINECONE_INDEX);
export const feedbackNamespace = index.namespace("feedback");
export const workspaceNamespace = index.namespace("workspace");


export async function upsertVectors(records, namespace) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("upsertVectors: records must be a non-empty array.");
  }

  if (!VALID_NAMESPACES.includes(namespace)) {
    throw new Error(
      `upsertVectors: namespace must be "feedback" or "workspace", got "${namespace}".`
    );
  }

  const ns = namespace === "feedback" ? feedbackNamespace : workspaceNamespace;

  for (const record of records) {
    if (!record.id) {
      throw new Error("upsertVectors: record.id is required");
    }

    if (!record.metadata?.projectId) {
      throw new Error(
        `upsertVectors: metadata.projectId is required (id=${record.id})`
      );
    }

  
    if (!Array.isArray(record.values)) {
      throw new Error(
        `upsertVectors: record.values must be an array (id=${record.id})`
      );
    }

    if (record.values.length !== EXPECTED_VECTOR_DIM) {
      throw new Error(
        `upsertVectors: vector dimension mismatch (id=${record.id}). ` +
        `Expected ${EXPECTED_VECTOR_DIM}, got ${record.values.length}`
      );
    }

    if (!record.values.every(v => typeof v === "number")) {
      throw new Error(
        `upsertVectors: all values must be numbers (id=${record.id})`
      );
    }
  }

  await ns.upsert({ records });
}


export async function queryEmbedding(vector, namespace, topK, projectId) {
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("queryEmbedding: vector must be a non-empty number array.");
  }

  if (vector.length !== EXPECTED_VECTOR_DIM) {
    throw new Error(
      `queryEmbedding: expected ${EXPECTED_VECTOR_DIM}-dim vector, got ${vector.length}. ` +
      `Use embed() or embedQuery() from embedding.service.js.`
    );
  }

  if (!vector.every(v => typeof v === "number")) {
    throw new Error("queryEmbedding: vector must contain only numbers.");
  }

  if (!VALID_NAMESPACES.includes(namespace)) {
    throw new Error(
      `queryEmbedding: namespace must be "feedback" or "workspace", got "${namespace}".`
    );
  }

  if (!Number.isInteger(topK) || topK < 1) {
    throw new Error(`queryEmbedding: topK must be a positive integer, got ${topK}.`);
  }

  if (!projectId) {
    throw new Error("queryEmbedding: projectId is required for filtering.");
  }

  const ns = namespace === "feedback" ? feedbackNamespace : workspaceNamespace;

  console.log(`[Pinecone] ${namespace} → topK=${topK}, projectId=${projectId}`);

  try {
    const results = await ns.query({
      vector,
      topK,
      includeMetadata: true,
      includeValues: false,
      filter: {
        projectId: { $eq: projectId }
      }
    });

    return (results.matches ?? []).map(match => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata
    }));

  } catch (err) {
    console.error("[Pinecone query error]", err);
    throw err;
  }
}


export async function deleteVectors(ids, namespace) {
  if (!Array.isArray(ids) || ids.length === 0) return;

  if (!VALID_NAMESPACES.includes(namespace)) {
    throw new Error(
      `deleteVectors: namespace must be "feedback" or "workspace", got "${namespace}".`
    );
  }

  const ns = namespace === "feedback" ? feedbackNamespace : workspaceNamespace;

  await ns.deleteMany({ ids });
}