import dotenv from "dotenv";
dotenv.config();
export const LLM_API_CONFIG = {
  provider: "groq",
  apiKey: process.env.LLM_API_KEY || process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  timeout: 60000,
  maxRetries: 3,
  maxElements: 100,
};