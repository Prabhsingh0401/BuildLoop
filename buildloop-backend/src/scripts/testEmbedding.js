import dotenv from "dotenv";
dotenv.config();

import { embed } from "../services/embedding.service.js";
import { feedbackNamespace } from "../lib/pinecone.js";

const TEST_VECTOR_ID = "__phase1_test_vector__";
const TEST_TEXT = "BuildLoop is an AI-assisted product management tool for dev teams.";

async function runTest() {
  console.log("\n=== BuildLoop — Phase 1 Verification ===\n");

  // STEP 1: Embedding 
  console.log("[1/4] Embedding test text via Voyage AI...");
  let vectors; // Removed `number[][]` type annotation

  try {
    vectors = await embed([TEST_TEXT]);
  } catch (err) {
    console.error("❌ Embedding FAILED:", err);
    process.exit(1);
  }

  const dim = vectors[0].length;
  if (dim !== 1024) {
    console.error(`❌ Vector length is ${dim}, expected 1024. Wrong model?`);
    process.exit(1);
  }
  console.log(`✅ Vector length: ${dim} — PASS\n`);

  // STEP 2: Pinecone upsert 
  console.log('[2/4] Upserting test vector to Pinecone (feedback namespace)...');

  try {
    await feedbackNamespace.upsert({
      records: [
        {
          id: TEST_VECTOR_ID,
          values: vectors[0],
          metadata: {
            text: TEST_TEXT,
            source: "phase1-test",
            projectId: "test-project-001",
          },
        },
      ],
    });

    console.log('✅ Upsert to "feedback" namespace — PASS\n');
  } catch (err) {
    console.error("❌ Pinecone upsert FAILED:", err);
    process.exit(1);
  }

  // STEP 3: Query to verify storage 
  console.log("[3/4] Querying Pinecone to verify retrieval (waiting 3s for index)...");
  await new Promise((r) => setTimeout(r, 3000));

  try {
    const results = await feedbackNamespace.query({
      vector: vectors[0],
      topK: 1,
      includeMetadata: true,
    });

    const match = results.matches?.[0];
    if (!match || match.id !== TEST_VECTOR_ID) {
      console.error("❌ Query returned unexpected result:", results.matches);
      process.exit(1);
    }

    console.log(`✅ Query returned 1 match, id=${match.id} — PASS`);
    console.log(`   Score: ${match.score?.toFixed(6)} (should be ~1.0 for self-match)\n`);
  } catch (err) {
    console.error("❌ Pinecone query FAILED:", err);
    process.exit(1);
  }

  // STEP 4: Cleanup 
  console.log("[4/4] Cleaning up test vector...");

  try {
    await feedbackNamespace.deleteOne({
      id: TEST_VECTOR_ID,
    });

    console.log("✅ Test vector deleted — PASS\n");
  } catch (err) {
    console.error("❌ Pinecone delete FAILED:", err);
    process.exit(1);
  }

  console.log("🎉 Phase 1 complete. All systems go.\n");
}

runTest();