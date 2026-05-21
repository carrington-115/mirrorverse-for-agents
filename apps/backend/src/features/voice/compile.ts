import type { DeployedAgent } from "@mirrorverse/types";
import type { Vapi } from "@vapi-ai/server-sdk";

const DIRECTION_PREAMBLE: Record<"inbound" | "outbound", string> = {
  inbound:
    "You are an inbound voice agent. You will receive calls from customers and help them with their requests. ",
  outbound:
    "You are an outbound calling agent. You are initiating this call on behalf of the business. ",
};

function inferModelProvider(modelId: string): string {
  if (modelId.startsWith("claude")) return "anthropic";
  if (modelId.startsWith("gemini")) return "google";
  return "openai";
}

export function compileToVapiAssistant(
  agent: DeployedAgent,
  webhookUrl: string,
): Vapi.CreateAssistantDto {
  const voice = agent.voice!;
  const direction = voice.direction ?? "inbound";
  const systemPrompt = DIRECTION_PREAMBLE[direction] + agent.system;

  const ttsProvider = voice.tts?.provider ?? "elevenlabs";
  const ttsModel = voice.tts?.model ?? "eleven_turbo_v2";
  const voiceId = voice.voiceId;

  const transcriberProvider = voice.transcriber?.provider ?? "deepgram";
  const transcriberModel = voice.transcriber?.model ?? "nova-2";
  const transcriberLanguage = voice.transcriber?.language ?? "en";

  const tools: Vapi.AnthropicModelToolsItem[] = agent.tools.flatMap((t) => {
    if (t.type === "single_mcp_tool") {
      return [
        {
          type: "function",
          function: {
            name: t.toolName,
            description: `MCP tool: ${t.toolName} (server: ${t.mcpServerName})`,
            parameters: {
              type: "object",
              properties: {},
            },
          },
          server: { url: webhookUrl },
        } as Vapi.AnthropicModelToolsItem,
      ];
    }
    return [];
  });

  const modelPayload = {
    provider: inferModelProvider(agent.model),
    model: agent.model,
    messages: [{ role: "system" as const, content: systemPrompt }],
    ...(tools.length > 0 ? { tools } : {}),
  } as Vapi.CreateAssistantDtoModel;

  const voicePayload = {
    provider: ttsProvider === "elevenlabs" ? "11labs" : ttsProvider,
    voiceId,
    model: ttsModel,
  } as Vapi.CreateAssistantDtoVoice;

  const transcriberPayload = {
    provider: transcriberProvider as "deepgram",
    model: transcriberModel,
    language: transcriberLanguage,
  } as Vapi.CreateAssistantDtoTranscriber;

  return {
    name: agent.name,
    model: modelPayload,
    voice: voicePayload,
    transcriber: transcriberPayload,
    firstMessage: voice.firstMessage,
    endCallPhrases: voice.endCallPhrases as string[],
    maxDurationSeconds: voice.maxDurationSec,
    server: { url: webhookUrl },
  };
}
