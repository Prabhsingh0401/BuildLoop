import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildloop';
    const dbName = process.env.MONGODB_DB_NAME;
    
    const options = {};
    if (dbName) {
      options.dbName = dbName;
    }

    await mongoose.connect(mongoURI, options);
    
    console.log(`MongoDB connected successfully${dbName ? ` to database: ${dbName}` : ''}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}