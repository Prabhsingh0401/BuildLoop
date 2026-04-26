import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../lib/mongo.js';
import { ingestWorkspaceFile } from '../services/workspaceIngestion.service.js';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = new mongoose.Types.ObjectId(); // Generate a valid ObjectId

// Create test files
const testFiles = [
  {
    name: 'sample.js',
    content: `// Sample JavaScript file for testing
function calculateSum(a, b) {
  return a + b;
}

function calculateProduct(a, b) {
  return a * b;
}

class Calculator {
  constructor() {
    this.history = [];
  }
  
  add(a, b) {
    const result = a + b;
    this.history.push({ operation: 'add', result });
    return result;
  }
  
  subtract(a, b) {
    const result = a - b;
    this.history.push({ operation: 'subtract', result });
    return result;
  }
  
  getHistory() {
    return this.history;
  }
}

export { Calculator, calculateSum, calculateProduct };

// More lines to test chunking
${Array(100).fill('// Filler line').join('\n')}`
  },
  {
    name: 'utils.py',
    content: `# Python utility functions
def hello_world():
    """Print hello world"""
    print("Hello, World!")

def add_numbers(a, b):
    """Add two numbers"""
    return a + b

def multiply_numbers(a, b):
    """Multiply two numbers"""
    return a * b

class Calculator:
    def __init__(self):
        self.result = 0
    
    def calculate(self, x, y, operation):
        if operation == 'add':
            self.result = x + y
        elif operation == 'multiply':
            self.result = x * y
        return self.result

# Test code
if __name__ == '__main__':
    calc = Calculator()
    print(calc.calculate(5, 3, 'add'))
    print(calc.calculate(5, 3, 'multiply'))

${Array(50).fill('# Comment line').join('\n')}`
  }
];

async function runTest() {
  console.log('\n=== 🚀 Workspace Ingestion Pipeline Test ===\n');

  try {
    // Step 0: Connect to DB
    console.log('[0/4] Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const { Workspace } = await import('../models/workspace.model.js');

    // Clear old test data
    console.log('[0/4] Clearing old test data...');
    const deleted = await Workspace.deleteMany({ projectId: PROJECT_ID });
    console.log(`✅ Deleted ${deleted.deletedCount} old documents\n`);

    // Test each file
    for (let i = 0; i < testFiles.length; i++) {
      const testFile = testFiles[i];
      console.log(`\n[${i + 1}/${testFiles.length}] Testing ingestion for: ${testFile.name}`);
      console.log('─'.repeat(60));

      // Convert string to Buffer (simulating file upload)
      const fileBuffer = Buffer.from(testFile.content, 'utf-8');
      const fileSizeKB = (fileBuffer.length / 1024).toFixed(2);

      console.log(`📄 File size: ${fileSizeKB} KB`);
      console.log(`📝 Lines: ${testFile.content.split('\n').length}`);

      try {
        // Call the ingestion service
        console.log(`\n🔄 Starting ingestion pipeline...`);
        const startTime = Date.now();

        const result = await ingestWorkspaceFile({
          fileBuffer,
          fileName: testFile.name,
          projectId: PROJECT_ID.toString(),
          userId: 'test-user-001'
        });

        const elapsedMs = Date.now() - startTime;

        console.log(`\n✅ Ingestion successful!`);
        console.log(`   📦 Chunks created: ${result.chunkCount}`);
        console.log(`   🔤 Language detected: ${result.language}`);
        console.log(`   📋 Document ID: ${result.documentId}`);
        console.log(`   ⏱️  Time elapsed: ${elapsedMs}ms`);

        // Verify in MongoDB
        console.log(`\n🔍 Verifying in MongoDB...`);
        const savedDoc = await Workspace.findById(result.documentId)
          .select('fileName language chunks projectId createdAt');

        if (savedDoc) {
          console.log(`✅ Document found in MongoDB`);
          console.log(`   • fileName: ${savedDoc.fileName}`);
          console.log(`   • language: ${savedDoc.language}`);
          console.log(`   • chunks stored: ${savedDoc.chunks.length} (Pinecone IDs)`);
          console.log(`   • projectId: ${savedDoc.projectId}`);
        } else {
          console.log(`❌ Document NOT found in MongoDB!`);
          process.exit(1);
        }

      } catch (error) {
        console.error(`\n❌ Ingestion failed for ${testFile.name}:`, error.message);
        throw error;
      }
    }

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('\n✨ ALL TESTS PASSED!\n');

    const allDocs = await Workspace.find({ projectId: PROJECT_ID });
    console.log(`📊 Summary:`);
    console.log(`   • Total files ingested: ${allDocs.length}`);
    console.log(`   • Total chunks: ${allDocs.reduce((sum, doc) => sum + (doc.chunks?.length || 0), 0)}`);
    console.log(`   • Project ID: ${PROJECT_ID}`);

    console.log(`\n📋 Full document details:\n`);
    for (const doc of allDocs) {
      console.log(`${doc.fileName}:`);
      console.log(`  • Language: ${doc.language}`);
      console.log(`  • Chunks: ${doc.chunks.length}`);
      console.log(`  • Created: ${doc.createdAt}`);
      console.log(`  • ID: ${doc._id}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB\n');
  }
}

runTest();
