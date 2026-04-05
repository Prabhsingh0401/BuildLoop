import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildloop';
    
    // 👇 ADD THIS LINE HERE
    console.log("Using Mongo URI:", mongoURI);
    
    await mongoose.connect(mongoURI);
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}