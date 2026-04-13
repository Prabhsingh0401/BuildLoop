import mongoose from 'mongoose';
import { Insight } from '../models/insight.model.js';

/**
 * Validates that every ID in insightIds array exists in the
 * Insight collection. Throws on any malformed or missing ID.
 * Caller must not save feature data if this throws.
 *
 * @param {string[]} insightIds
 * @returns {Promise<void>}
 */
async function validateInsightIds(insightIds) {
  // Guard: must be a non-empty array
  if (!Array.isArray(insightIds) || insightIds.length === 0) {
    throw new Error('insightIds must be a non-empty array');
  }

  // Split into valid and malformed ObjectId strings
  const validIds     = insightIds.filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );
  const malformedIds = insightIds.filter((id) =>
    !mongoose.Types.ObjectId.isValid(id)
  );

  if (malformedIds.length > 0) {
    console.error('[validateInsightIds] Malformed IDs:', malformedIds);
    throw new Error(
      `Invalid ObjectId format: ${malformedIds.join(', ')}`
    );
  }

  // Query MongoDB — fetch only _id to keep it lightweight
  const found = await Insight.find(
    { _id: { $in: validIds } },
    { _id: 1 }
  ).lean();

  const foundIds   = found.map((doc) => doc._id.toString());
  const missingIds = insightIds.filter((id) => !foundIds.includes(id));

  if (missingIds.length > 0) {
    console.error('[validateInsightIds] Missing IDs:', missingIds);
    throw new Error(
      `insightIds not found in Insight collection: ${missingIds.join(', ')}`
    );
  }
  // All IDs verified — caller may proceed to save
}

export default validateInsightIds;
