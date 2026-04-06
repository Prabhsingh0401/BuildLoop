import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../lib/mongo.js";

async function runTest() {
  console.log("\n=== 🚀 MongoDB Persistent Write Test ===\n");
  
  try {
    // 1. Connect to DB
    await connectDB();
    
    // Dynamically import models AFTER dotenv.config() is initialized
    const { Insight } = await import("../models/insight.model.js");
    const { Feedback } = await import("../models/feedback.model.js");

    const dbName = mongoose.connection.db.databaseName;
    console.log(`📡 Connected to database: ${dbName}`);

    // 2. Test Feedback Write
    console.log(`\n[1/2] Testing Feedback Write to collection: ${Feedback.collection.name}...`);
    const testFeedback = new Feedback({
      projectId: new mongoose.Types.ObjectId(),
      createdBy: "clerk_user_test_99",
      source: "paste",
      rawText: "This data should live in 'feedback' collection.",
      metadata: { type: "other" }
    });
    await testFeedback.save();
    console.log(`✅ Feedback saved! ID: ${testFeedback._id}`);

    // 3. Test Insight Write
    console.log(`\n[2/2] Testing Insight Write to collection: ${Insight.collection.name}...`);
    const testInsight = new Insight({
      projectId: testFeedback.projectId,
      feedbackIds: [testFeedback._id],
      clusterLabel: "Test Cluster",
      summary: "This data should live in 'insight' collection.",
      sentiment: "positive",
      frequency: 1
    });
    await testInsight.save();
    console.log(`✅ Insight saved! ID: ${testInsight._id}`);

    console.log("\n✨ Verification Ready: I have NOT deleted the test data.");
    console.log("👉 Please check the 'Insights_feedback' database in Atlas or Compass.");
    console.log("Look for collections: 'feedback' and 'insight'.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ MongoDB Test FAILED:", error);
    process.exit(1);
  }
}

runTest();
