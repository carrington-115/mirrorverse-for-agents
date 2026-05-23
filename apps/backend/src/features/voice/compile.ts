import type { ElevenLabsVoiceMode, VoiceAgentNode } from "@mirrorverse/types";
import type { Vapi } from "@vapi-ai/server-sdk";

// Name of the first-party RAG tool. The compiler emits it with this name and
// the voice webhook dispatches it by this name, so the two must agree.
export const KNOWLEDGE_SEARCH_TOOL_NAME = "knowledge_search";

const DIRECTION_PREAMBLE: Record<"inbound" | "outbound", string> = {
  inbound:
    "You are an inbound voice agent. You will receive calls from customers and help them with their requests. ",
  outbound:
    "You are an outbound calling agent. You are initiating this call on behalf of the business. ",
};

interface ElevenLabsVoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
}

const VOICE_MODE_SETTINGS: Record<
  ElevenLabsVoiceMode,
  ElevenLabsVoiceSettings
> = {
  conversational: { stability: 0.5, similarityBoost: 0.75, style: 0.0 },
  narrative: { stability: 0.65, similarityBoost: 0.8, style: 0.3 },
  emotional: { stability: 0.3, similarityBoost: 0.75, style: 0.7 },
  advertisement: { stability: 0.6, similarityBoost: 0.85, style: 0.45 },
  entertainment: { stability: 0.35, similarityBoost: 0.7, style: 0.6 },
};

export function mapTtsProvider(provider: string): string {
  switch (provider) {
    case "elevenlabs":
      return "11labs";
    default:
      return provider;
  }
}

export function compileToVapiAssistant(
  node: VoiceAgentNode,
  webhookUrl: string,
): Vapi.CreateAssistantDto {
  const hasKnowledge = (node.knowledgeBaseIds?.length ?? 0) > 0;

  // When the agent has knowledge bases, tell it (in-prompt) to use the tool and
  // ground answers in the excerpts it returns.
  const knowledgePreamble = hasKnowledge
    ? " You have a knowledge_search tool connected to the business's knowledge base. " +
      "When the caller asks something the business's documents, policies, pricing, hours, or FAQs might answer, " +
      "call knowledge_search first and base your answer on the returned excerpts. If it returns nothing relevant, say you don't have that information."
    : "";

  const systemPrompt =
    DIRECTION_PREAMBLE[node.direction] +
    node.modelConnection.systemPrompt +
    knowledgePreamble;

  const tools: Vapi.AnthropicModelToolsItem[] = node.toolsEndpoint.tools.map(
    (t) => ({
      type: "function",
      function: {
        name: t.toolName,
        description: `MCP tool: ${t.toolName} (server: ${t.mcpServerName})`,
        parameters: {
          type: "object",
          properties: {},
        },
      },
      server: { url: node.toolsEndpoint.serverUrl },
    }),
  );

  // First-party RAG tool. Unlike MCP tools (which route to the agent's MCP
  // server URL), this one must route to the voice webhook so handleToolCalls
  // can run the pgvector search directly. Per-tool server.url overrides the
  // assistant-level one in Vapi.
  if (hasKnowledge) {
    tools.push({
      type: "function",
      function: {
        name: KNOWLEDGE_SEARCH_TOOL_NAME,
        description:
          "Search the business's knowledge base to answer the caller's question. Call this before answering anything the company's documents, policies, pricing, hours, or FAQs might cover, then base your answer on the returned excerpts.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "What to look up, in the caller's own words.",
            },
            topK: {
              type: "number",
              description:
                "How many excerpts to retrieve (optional, default 6).",
            },
          },
          required: ["query"],
        },
      },
      server: { url: webhookUrl },
    });
  }

  const modelPayload = {
    provider: node.modelConnection.provider,
    model: node.modelConnection.model,
    messages: [{ role: "system" as const, content: systemPrompt }],
    ...(tools.length > 0 ? { tools } : {}),
  } as Vapi.CreateAssistantDtoModel;

  const modeSettings =
    VOICE_MODE_SETTINGS[node.voiceEntry.voiceMode ?? "conversational"];

  const voicePayload = {
    provider: mapTtsProvider(node.voiceEntry.provider),
    voiceId: node.voiceEntry.voiceId,
    model: node.voiceEntry.model,
    stability: node.voiceEntry.stability ?? modeSettings.stability,
    similarityBoost:
      node.voiceEntry.similarityBoost ?? modeSettings.similarityBoost,
    style: node.voiceEntry.style ?? modeSettings.style,
  } as Vapi.CreateAssistantDtoVoice;

  let transcriberPayload: Vapi.CreateAssistantDtoTranscriber;
  if (node.transcriber) {
    transcriberPayload = {
      provider: node.transcriber.provider as "deepgram",
      model: node.transcriber.model,
      language: node.transcriber.language,
    } as Vapi.CreateAssistantDtoTranscriber;
  } else {
    transcriberPayload = {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    } as Vapi.CreateAssistantDtoTranscriber;
  }

  return {
    name: node.name,
    model: modelPayload,
    voice: voicePayload,
    transcriber: transcriberPayload,
    firstMessage: node.firstMessage,
    endCallPhrases: node.endCallPhrases as string[],
    maxDurationSeconds: node.maxDurationSec,
    server: { url: webhookUrl },
  };
}
