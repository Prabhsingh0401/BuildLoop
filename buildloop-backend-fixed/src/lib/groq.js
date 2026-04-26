import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set in environment variables");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Adapter to mimic Gemini's interface so we don't have to rewrite all service logic
export const groqModel = {
  async generateContent({ contents }) {
    // contents is an array of { role: "user" | "model", parts: [{ text: "..." }] }
    const messages = contents.map(c => ({
      role: c.role === "model" ? "assistant" : c.role,
      content: c.parts.map(p => p.text).join("\n")
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile", // Using one of Groq's best fast models
    });

    const text = chatCompletion.choices[0]?.message?.content || "";
    
    return {
      response: {
        text: () => text
      }
    };
  }
};
