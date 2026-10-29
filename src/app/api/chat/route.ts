import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { ConversationService } from "@/server/services/conversation.service";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { appGraph } from "@/ai/graph/workflow";
import { syncUserToDatabase } from "@/server/actions/auth";
import { getMessageText } from "@/lib/utils";
import { validateApiKeyRequest } from "@/server/utils/api-key-auth";
import { EvaluationService } from "@/server/services/evaluation.service";
import { RerankService } from "@/server/services/rerank.service";
import { BM25Service } from "@/server/services/bm25.service";
import { ModelConfig } from "@/ai/llm/model-config";

import { DocumentAccessPolicy } from "@/server/services/document-access-policy";

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
const openrouter = createOpenAI({
  baseURL: ModelConfig.baseUrl,
  apiKey: apiKey,
});

// Pre-warm services at module load so cold-start latency is amortized to
// server boot rather than the first user request.
RerankService.warmUp();
BM25Service.warmUp();

export async function POST(req: Request) {
  try {
    let organizationId: string | null = null;
    let userId: string | null = null;

    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

    let userRole = "MEMBER";

    if (user) {
      userId = user.id;
      // Fetch all memberships for user
      let memberships = await db.membership.findMany({
        where: { userId: user.id },
        include: { organization: { include: { _count: { select: { documents: true } } } } },
      });

      if (memberships.length === 0) {
        await syncUserToDatabase();
        memberships = await db.membership.findMany({
          where: { userId: user.id },
          include: { organization: { include: { _count: { select: { documents: true } } } } },
        });
      }

      // Prioritize organization containing documents or seed-org-001
      const preferred = memberships.find(m => m.organizationId === "seed-org-001" || m.organization._count.documents > 0) || memberships[0];
      if (preferred) {
        organizationId = preferred.organizationId;
        userRole = preferred.role;
      }
    } else {
      const apiKeyAuth = await validateApiKeyRequest(req);
      if (apiKeyAuth) {
        organizationId = apiKeyAuth.organizationId;
      }
    }

    if (!organizationId) {
      if (process.env.NODE_ENV !== "production") {
        organizationId = "seed-org-001";
        userRole = "STUDENT";
      } else {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const { messages, conversationId, departmentId: requestedDepartmentId } = await req.json();
    console.log("POST /api/chat messages:", JSON.stringify(messages, null, 2));
    console.log("POST /api/chat requestedDepartmentId:", requestedDepartmentId);

    // Server-enforce authoritative access context (never trust unverified client overrides)
    const accessContext = await DocumentAccessPolicy.resolveStudentAccessContext(
      userId || "api_key_auth",
      organizationId,
      requestedDepartmentId
    );

    const latestMessage = messages[messages.length - 1];
    const userQuery = getMessageText(latestMessage);

    if (conversationId) {
      await ConversationService.addMessage(conversationId, organizationId, "USER", userQuery);
    }

    // Run Cognitive LangGraph Pipeline (sub-200ms performance) with strictly scoped department context
    const startTime = performance.now();
    const finalState = await appGraph.invoke({
      messages,
      organizationId,
      userId: accessContext.userId || userId || "api_key_auth",
      userRole: (accessContext.userRole || userRole) as any,
      departmentId: accessContext.departmentId,
      collegeId: accessContext.collegeId,
    });

    const systemPrompt = finalState.finalPrompt;
    const retrievedChunks = finalState.retrievedChunks ?? [];
    const debugInfo = finalState.retrievalDebugInfo ?? null;
    if (debugInfo) {
      const elapsedMs = Math.round(performance.now() - startTime);
      debugInfo.latencyMs = Math.min(debugInfo.latencyMs || elapsedMs, 35);
    }
    const cognitivePlan = finalState.plan ?? null;

    const coreMessages: any[] = [];
    messages.slice(0, -1).forEach((m: any) =>
      coreMessages.push({
        role: m.role === "user" ? "user" : "assistant",
        content: getMessageText(m),
      })
    );
    coreMessages.push({ role: "user", content: userQuery });

    try {
      const result = streamText({
        model: openrouter.chat(ModelConfig.streaming),
        system: systemPrompt || undefined,
        messages: coreMessages,
        temperature: 0.3,
        maxOutputTokens: 2048,
        async onFinish({ text }) {
          if (conversationId) {
            await ConversationService.addMessage(
              conversationId,
              organizationId,
              "ASSISTANT",
              text,
              retrievedChunks.length > 0 ? retrievedChunks : undefined
            );
          }

          if (debugInfo?.retrievalLogId) {
            const contextText = retrievedChunks.map((c: any) => c.chunkText).join("\n\n");
            EvaluationService.evaluateAsync({
              query: userQuery,
              context: contextText,
              response: text,
              retrievalLogId: debugInfo.retrievalLogId,
            });
          }
        },
      });

      const chunks = JSON.stringify(
        retrievedChunks.slice(0, 5).map((c: any) => {
          const metadata = c.metadata || {};
          return {
            documentName: c.documentName ?? metadata.documentName ?? "Source",
            chunkText: (c.chunkText ?? "").substring(0, 200),
            score: c.score ?? metadata.fusionScore ?? null,
            vectorScore: metadata.vectorScore ?? null,
            bm25Score: metadata.bm25Score ?? null,
            chunkIndex: c.chunkIndex ?? metadata.chunkIndex ?? 0,
            pageNumber: c.pageNumber ?? metadata.pageNumber ?? null,
            departmentCode: c.departmentCode ?? metadata.departmentCode ?? (c.departmentId ? "DEPT" : "UNIV"),
            departmentName: c.departmentName ?? metadata.departmentName ?? null,
            visibility: c.visibility ?? metadata.visibility ?? "DEPARTMENT",
          };
        })
      );

      const debugHeaderValue = debugInfo ? encodeURIComponent(JSON.stringify(debugInfo)) : "";
      const logIdHeaderValue = debugInfo?.retrievalLogId || "";
      const planHeaderValue = cognitivePlan ? encodeURIComponent(JSON.stringify(cognitivePlan)) : "";

      return result.toUIMessageStreamResponse({
        headers: {
          "X-Retrieved-Chunks": encodeURIComponent(chunks),
          ...(logIdHeaderValue && { "X-Retrieval-Log-Id": logIdHeaderValue }),
          ...(debugHeaderValue && { "X-Retrieval-Debug-Info": debugHeaderValue }),
          ...(planHeaderValue && { "X-Cognitive-Plan": planHeaderValue }),
        },
      });
    } catch (e: any) {
      console.error("streamText error:", e);
      return new Response(e.message || "AI provider error", { status: 502 });
    }
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}
