import mongoose from 'mongoose';
import { Insight } from '../models/insight.model.js';
import validateInsightIds from './validateInsightIds.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Insert 2 dummy Insight documents for testing
  // frequency is required: true in the existing schema — must include it
  const docs = await Insight.insertMany([
    {
      projectId:    new mongoose.Types.ObjectId(),
      clusterLabel: 'Test Cluster A',
      summary:      'Summary for cluster A',
      sentiment:    'positive',
      frequency:    3,
    },
    {
      projectId:    new mongoose.Types.ObjectId(),
      clusterLabel: 'Test Cluster B',
      summary:      'Summary for cluster B',
      sentiment:    'negative',
      frequency:    1,
    },
  ]);

  const validIds = docs.map((d) => d._id.toString());
  const fakeId   = new mongoose.Types.ObjectId().toString();

  // Test 1 — all valid IDs → must pass silently
  try {
    await validateInsightIds(validIds);
    console.log('✅ Test 1 passed — valid IDs accepted');
  } catch (e) {
    console.error('❌ Test 1 failed:', e.message);
  }

  // Test 2 — one missing ID → must throw
  try {
    await validateInsightIds([...validIds, fakeId]);
    console.error('❌ Test 2 failed — should have thrown for missing ID');
  } catch (e) {
    console.log('✅ Test 2 passed — missing ID caught:', e.message);
  }

  // Test 3 — malformed ID string → must throw
  try {
    await validateInsightIds(['not-a-valid-objectid']);
    console.error('❌ Test 3 failed — should have thrown for malformed ID');
  } catch (e) {
    console.log('✅ Test 3 passed — malformed ID caught:', e.message);
  }

  // Test 4 — empty array → must throw
  try {
    await validateInsightIds([]);
    console.error('❌ Test 4 failed — should have thrown for empty array');
  } catch (e) {
    console.log('✅ Test 4 passed — empty array caught:', e.message);
  }

  // Cleanup — remove only the test documents we inserted
  await Insight.deleteMany({ _id: { $in: docs.map((d) => d._id) } });
  console.log('🧹 Test documents cleaned up');

  await mongoose.disconnect();
  console.log('✅ Done');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
