import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

if (!PINECONE_API_KEY) throw new Error("PINECONE_API_KEY is not set in .env");
if (!PINECONE_INDEX) throw new Error("PINECONE_INDEX is not set in .env");

//Connects your backend → Pinecone
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });

// ─── Index handle
//Connect to index=db
// .index() is cheap — it just returns a typed handle to the named index.
// It does NOT make a network call. All the actual calls happen when call .upsert(), .query(), .deleteOne(), etc.
export const index = pinecone.index(PINECONE_INDEX);

// ─── Namespace handles(tables)
// These are the two pre-bound namespace handles every service imports.
// Instead of writing index.namespace("feedback") everywhere, services just use:

export const feedbackNamespace = index.namespace("feedback");
export const workspaceNamespace = index.namespace("workspace");

//This is the search engine of your app

export async function queryEmbedding(
  vector: number[],
  namespace: "feedback" | "workspace",
  topK: number
) {
  const ns = namespace === "feedback" ? feedbackNamespace : workspaceNamespace;

  const results = await ns.query({
    vector,
    topK,
    includeMetadata: true,  
    includeValues: false,   // We don't need the raw vectors back, saves bandwidth
  });

  return results.matches ?? [];
}