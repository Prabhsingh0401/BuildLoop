import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('teammembers');
    
    const indexes = await collection.indexes();
    console.log('Indexes for teammembers collection:');
    console.dir(indexes, { depth: null });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkIndexes();
