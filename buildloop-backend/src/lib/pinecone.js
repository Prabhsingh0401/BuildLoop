import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set. Add it to your .env file.");
}
if (!process.env.PINECONE_INDEX) {
  throw new Error("PINECONE_INDEX is not set. Add the index name to your .env file.");
}

const VALID_NAMESPACES = ["feedback", "workspace"];
const EXPECTED_VECTOR_DIM = 1024; 

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

export const index              = pinecone.index(process.env.PINECONE_INDEX);
export const feedbackNamespace  = index.namespace("feedback");
export const workspaceNamespace = index.namespace("workspace");

// upsertVectors() is a thin wrapper around the Pinecone upsert method, with added validation and namespace handling.

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

  // Ensure every record has projectId in metadata
  for (const record of records) {
    if (!record.metadata?.projectId) {
      throw new Error("upsertVectors: metadata.projectId is required for filtering.");
    }
  }

  // v7 API: upsert takes { records: [...] } not a plain array
  await ns.upsert({ records });
}

// queryEmbedding() 
// Cosine similarity search in the specified namespace.

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

  if (!VALID_NAMESPACES.includes(namespace)) {
    throw new Error(
      `queryEmbedding: namespace must be "feedback" or "workspace", got "${namespace}".`
    );
  }

  if (!Number.isInteger(topK) || topK < 1) {
    throw new Error(`queryEmbedding: topK must be a positive integer, got ${topK}.`);
  }

  // projectId validation
  if (!projectId) {
    throw new Error("queryEmbedding: projectId is required for filtering.");
  }

  const ns = namespace === "feedback" ? feedbackNamespace : workspaceNamespace;

  // LOGGING (debug-friendly)
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

    // CLEAN RETURN FORMAT
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

// deleteVectors()

export async function deleteVectors(ids, namespace) {
  // Empty array = nothing to delete. Not an error — ingestion.service may call
  // this defensively even when pineconeIds is empty.
  if (!Array.isArray(ids) || ids.length === 0) return;

  if (!VALID_NAMESPACES.includes(namespace)) {
    throw new Error(
      `deleteVectors: namespace must be "feedback" or "workspace", got "${namespace}".`
    );
  }

  const ns = namespace === "feedback" ? feedbackNamespace : workspaceNamespace;

  await ns.deleteMany({ ids });
}