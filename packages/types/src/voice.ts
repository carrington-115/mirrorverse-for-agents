import type {
  Cents,
  PhoneNumberId,
  Tenanted,
  Timestamps,
  VoiceAgentId,
  VoiceCallId,
  WorkflowId,
} from "./common";

/** Local mirror of a Vapi/Retell assistant. The provider holds the runtime. */
export interface VoiceAgent extends Timestamps, Tenanted {
  readonly id: VoiceAgentId;
  readonly workflowId: WorkflowId;
  readonly provider: "vapi" | "retell" | "elevenlabs";
  readonly externalAssistantId: string;
  readonly voiceId: string;
  readonly model: string;
  readonly systemPrompt: string;
  readonly firstMessage: string;
  readonly endCallPhrases: readonly string[];
  readonly maxDurationSec: number;
  readonly enabled: boolean;
}

export type PhoneNumberStatus = "provisioning" | "active" | "released" | "failed";

export interface PhoneNumber extends Timestamps, Tenanted {
  readonly id: PhoneNumberId;
  readonly e164: string;
  readonly twilioSid: string;
  readonly providerNumberId: string | null;
  readonly voiceAgentId: VoiceAgentId | null;
  readonly status: PhoneNumberStatus;
  readonly capabilities: {
    readonly voice: boolean;
    readonly sms: boolean;
    readonly mms: boolean;
  };
  readonly monthlyCostCents: Cents;
  readonly releasedAt: Date | null;
}

export type VoiceCallDirection = "inbound" | "outbound";
export type VoiceCallStatus =
  | "ringing"
  | "in_progress"
  | "completed"
  | "no_answer"
  | "busy"
  | "failed";

/** Cached call summary. Recording / transcript live in the provider's bucket. */
export interface VoiceCall extends Timestamps, Tenanted {
  readonly id: VoiceCallId;
  readonly voiceAgentId: VoiceAgentId;
  readonly phoneNumberId: PhoneNumberId;
  readonly externalCallId: string;
  readonly direction: VoiceCallDirection;
  readonly fromNumber: string;
  readonly toNumber: string;
  readonly status: VoiceCallStatus;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  readonly durationSec: number | null;
  readonly transcriptUrl: string | null;
  readonly recordingUrl: string | null;
  readonly summary: string | null;
  readonly costCents: Cents;
  readonly endedReason: string | null;
}

export interface VoiceTranscriptMessage {
  readonly id: string;
  readonly callId: VoiceCallId;
  readonly role: "agent" | "customer";
  readonly text: string;
  readonly tsOffsetMs: number;
}
