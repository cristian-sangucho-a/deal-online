import { ChatMistralAI } from "@langchain/mistralai";
import { tools } from "./tools";

export const llm = new ChatMistralAI({
  model: "mistral-large-latest", // or "mistral-medium", "mistral-small"
  temperature: 0.7,
  apiKey: process.env.MISTRAL_API_KEY,
  maxTokens: 1024,
}).bindTools(tools);
