import crypto from 'crypto';
import { codeChunker } from '../lib/chunker.js';
import { embed } from './embedding.service.js';
import { upsertVectors } from '../lib/pinecone.js';
import { Workspace } from '../models/workspace.model.js';

/**
 * Full ingestion pipeline for workspace code files:
 * chunk (600-line) → embed → upsert to Pinecone:workspace → save to MongoDB
 *
 * @param {Object} params
 * @param {Buffer} params.fileBuffer   - File content as Buffer
 * @param {string} params.fileName     - Original file name (used for language detection)
 * @param {string} params.projectId    - MongoDB ObjectId (string) of the project
 * @param {string} [params.userId]     - User ID who uploaded the file
 *
 * @returns {{ chunkCount: number, documentId: string, language: string }}
 */
export async function ingestWorkspaceFile({ fileBuffer, fileName, projectId, userId = 'system' }) {
  console.log(`\x1b[36m[WorkspaceIngestion] Starting pipeline for: ${fileName}\x1b[0m`);

  // Step 1 — Convert buffer to string and chunk
  const fileContent = fileBuffer.toString('utf-8');
  const chunks = codeChunker(fileContent, fileName);
  
  // Extract language from first chunk metadata
  const languageMatch = chunks[0]?.match(/\[LANGUAGE\]\s+(\w+)/);
  const language = languageMatch ? languageMatch[1] : 'plaintext';
  
  console.log(`\x1b[36m[WorkspaceIngestion] Step 1: Split ${fileName} into ${chunks.length} chunks (language: ${language}).\x1b[0m`);

  if (chunks.length === 0) {
    throw new Error('File produced zero chunks after splitting.');
  }

  // Step 2 — Embed all chunks via Voyage AI
  console.log(`\x1b[36m[WorkspaceIngestion] Step 2: Requesting embeddings from Voyage AI...\x1b[0m`);
  const vectors = await embed(chunks);
  console.log(`\x1b[36m[WorkspaceIngestion] Step 2: Received ${vectors.length} vectors (1024-dim).\x1b[0m`);

  if (vectors.length !== chunks.length) {
    throw new Error(`Embedding count mismatch: ${chunks.length} chunks but ${vectors.length} vectors.`);
  }

  // Step 3 — Build Pinecone records and upsert to namespace:workspace
  const pineconeIds = chunks.map(() => `workspace-${crypto.randomUUID()}`);
  console.log(`\x1b[36m[WorkspaceIngestion] Step 3: Upserting ${pineconeIds.length} vectors to Pinecone...\x1b[0m`);

  const records = pineconeIds.map((id, i) => ({
    id,
    values: vectors[i],
    metadata: {
      projectId: projectId.toString(),
      fileName,
      language,
      chunkIndex: i,
      uploadedBy: userId,
    },
  }));

  await upsertVectors(records, 'workspace');
  console.log(`\x1b[36m[WorkspaceIngestion] Step 3: Pinecone upsert complete.\x1b[0m`);

  // Step 4 — Persist the WorkspaceContext document to MongoDB with the Pinecone IDs
  console.log(`\x1b[36m[WorkspaceIngestion] Step 4: Saving workspace context to MongoDB...\x1b[0m`);
  const doc = await Workspace.create({
    projectId,
    fileName,
    language,
    rawContent: fileContent,
    chunks: pineconeIds, // Store Pinecone IDs, not the actual chunk content
  });
  console.log(`\x1b[36m[WorkspaceIngestion] Step 4: MongoDB Save complete. ID: ${doc._id}\x1b[0m`);

  return {
    chunkCount: chunks.length,
    documentId: doc._id.toString(),
    language,
  };
}
