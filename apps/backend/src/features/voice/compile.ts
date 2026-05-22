import type { ElevenLabsVoiceMode, VoiceAgentNode } from "@mirrorverse/types";
import type { Vapi } from "@vapi-ai/server-sdk";

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
  const systemPrompt =
    DIRECTION_PREAMBLE[node.direction] + node.modelConnection.systemPrompt;

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
