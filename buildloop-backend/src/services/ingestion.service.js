import crypto from 'crypto';
import { chunkText } from '../lib/chunker.js';
import { embed } from './embedding.service.js';
import { upsertVectors } from '../lib/pinecone.js';
import { Feedback } from '../models/feedback.model.js';

/**
 * Full ingestion pipeline: chunk → embed → upsert to Pinecone → save to MongoDB.
 *
 * @param {Object} params
 * @param {string} params.rawText      - Raw feedback text
 * @param {string} params.projectId    - MongoDB ObjectId (string) of the project
 * @param {string} params.createdBy    - Clerk userId of the submitter
 * @param {string} [params.source]     - 'paste' | 'file' | 'url'  (defaults to 'paste')
 * @param {string} [params.metaType]   - 'interview' | 'review' | 'survey' | 'other'
 *
 * @returns {{ chunkCount: number, documentId: string }}
 */
export async function ingestFeedback({ rawText, projectId, createdBy, source = 'paste', metaType = 'other' }) {
  console.log(`\x1b[34m[Ingestion] Starting pipeline for project: ${projectId}\x1b[0m`);

  // Step 1 — Chunk the raw text
  const chunks = chunkText(rawText);
  console.log(`\x1b[34m[Ingestion] Step 1: Divided text into ${chunks.length} chunks.\x1b[0m`);

  if (chunks.length === 0) {
    throw new Error('Text produced zero chunks after splitting.');
  }

  // Step 2 — Embed all chunks via Voyage AI
  console.log(`\x1b[34m[Ingestion] Step 2: Requesting embeddings from Voyage AI...\x1b[0m`);
  const vectors = await embed(chunks);
  console.log(`\x1b[34m[Ingestion] Step 2: Received ${vectors.length} vectors (1024-dim).\x1b[0m`);

  if (vectors.length !== chunks.length) {
    throw new Error(`Embedding count mismatch: ${chunks.length} chunks but ${vectors.length} vectors.`);
  }

  // Step 3 — Build Pinecone records and upsert to namespace:feedback
  const pineconeIds = chunks.map(() => `feedback-${crypto.randomUUID()}`);
  console.log(`\x1b[34m[Ingestion] Step 3: Upserting ${pineconeIds.length} vectors to Pinecone...\x1b[0m`);

  const records = pineconeIds.map((id, i) => ({
    id,
    values: vectors[i],
    metadata: {
      projectId: projectId.toString(),
      createdBy: createdBy || 'unknown',
      chunkIndex: i,
      text: chunks[i],
    },
  }));

  await upsertVectors(records, 'feedback');
  console.log(`\x1b[34m[Ingestion] Step 3: Pinecone upsert complete.\x1b[0m`);

  // Step 4 — Persist the FeedbackDocument to MongoDB with the Pinecone IDs
  console.log(`\x1b[34m[Ingestion] Step 4: Saving feedback document to MongoDB...\x1b[0m`);
  const doc = await Feedback.create({
    projectId,
    createdBy,
    source,
    rawText,
    chunks,
    pineconeIds,
    metadata: { type: metaType },
  });
  console.log(`\x1b[34m[Ingestion] Step 4: MongoDB Save complete. ID: ${doc._id}\x1b[0m`);

  return {
    chunkCount: chunks.length,
    documentId: doc._id.toString(),
  };
}
