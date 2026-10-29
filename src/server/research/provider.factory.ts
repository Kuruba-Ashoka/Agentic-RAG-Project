/**
 * Provider factory — returns the active ResearchNotebookProvider based on
 * the RESEARCH_PROVIDER environment variable.
 *
 *   RESEARCH_PROVIDER=gemini  → GeminiNotebookProvider (default with real AI synthesis)
 *   RESEARCH_PROVIDER=mock    → MockResearchProvider
 */

import type { ResearchNotebookProvider } from "./provider.interface";

let cachedProvider: ResearchNotebookProvider | null = null;

export function getResearchProvider(): ResearchNotebookProvider {
  if (cachedProvider) return cachedProvider;

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
  const requestedMode = (process.env.RESEARCH_PROVIDER ?? "").toLowerCase();
  const mode = requestedMode || (hasApiKey ? "gemini" : "gemini");

  if (mode !== "mock") {
    try {
      const { GeminiResearchProvider } = require("./gemini-notebook.provider");
      cachedProvider = new GeminiResearchProvider();
      console.log("[NexusIQ Research Workspace] Provider: gemini (Gemini 2.5 Flash / Real RAG Synthesis)");
      return cachedProvider!;
    } catch (err) {
      console.warn("[NexusIQ Research Workspace] Failed to initialize Gemini provider, falling back to mock:", err);
    }
  }

  const { MockResearchProvider } = require("./mock-research.provider");
  cachedProvider = new MockResearchProvider();
  console.log("[ResearchBridge] Provider: mock (Development mode — no real external calls)");

  return cachedProvider!;
}

/** Returns the provider name and development mode status for UI display. */
export function getProviderMeta(): { providerName: string; isDevelopmentMode: boolean } {
  const p = getResearchProvider();
  return { providerName: p.providerName, isDevelopmentMode: p.isDevelopmentMode };
}
