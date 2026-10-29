import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { ModelConfig } from "./model-config";

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
if (!process.env.OPENAI_API_KEY && apiKey) {
  process.env.OPENAI_API_KEY = apiKey;
}

export const llm = new ChatOpenAI({
  model: ModelConfig.reasoning,
  temperature: 0.3,
  maxTokens: 2048,
  openAIApiKey: apiKey,
  apiKey: apiKey,
  configuration: {
    baseURL: ModelConfig.baseUrl,
    apiKey: apiKey,
    defaultHeaders: {
      Authorization: `Bearer ${apiKey}`,
    },
  },
});

// Lightweight model for planning/routing — lower temp, capped token budget
export const lightweightLlm = new ChatOpenAI({
  model: ModelConfig.lightweight,
  temperature: 0.1,
  maxTokens: 512,
  openAIApiKey: apiKey,
  apiKey: apiKey,
  configuration: {
    baseURL: ModelConfig.baseUrl,
    apiKey: apiKey,
    defaultHeaders: {
      Authorization: `Bearer ${apiKey}`,
    },
  },
});
