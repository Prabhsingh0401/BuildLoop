import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Task } from '../models/task.model.js';
import { Workspace } from '../models/workspace.model.js';
import { Feature } from '../models/feature.model.js';
import { Insight } from '../models/insight.model.js';

dotenv.config();

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI missing in .env');
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB at cluster0.');

    // Create a dummy Project ID for scoping
    const projectId = new mongoose.Types.ObjectId();

    console.log('🌱 Seeding Workspace...');
    const workspace = await Workspace.create({
      projectId,
      fileName: 'App.jsx',
      language: 'javascript',
      rawContent: 'export default function App() {}',
      chunks: ['chunk1-hash']
    });

    console.log('🌱 Seeding Insight...');
    const insight = await Insight.create({
      projectId,
      clusterLabel: 'User Authentication requests',
      summary: 'Users want OAuth integrations',
      sentiment: 'positive',
      frequency: 15,
      representativeQuotes: ['Please add Google login']
    });

    console.log('🌱 Seeding Feature...');
    const feature = await Feature.create({
      insightIds: [insight._id],
      title: 'OAuth Authentication',
      priorityScore: 92,
      priorityRationale: 'High user demand identified from insights',
      effort: 'medium',
      impact: 'high',
      status: 'todo'
    });

    console.log('🌱 Seeding Task...');
    const task = await Task.create({
      projectId,
      featureId: feature._id,
      title: 'Implement Clerk Auth Provider',
      description: 'Setup Clerk across frontend and backend middleware',
      status: 'todo',
      tags: ['auth', 'clerk', 'frontend']
    });

    console.log('🎉 Dummy data successfully verified and committed to MongoDB!');
    console.log({
      workspaceId: workspace._id,
      insightId: insight._id,
      featureId: feature._id,
      taskId: task._id
    });

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from DB');
  }
}

seed();
