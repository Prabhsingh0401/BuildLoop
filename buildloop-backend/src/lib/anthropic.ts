import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set in your .env file");
}

// Singleton client 
export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});


export const CLAUDE_MODEL = "claude-sonnet-4-20250514";



