import type { ToolUIPart } from "ai";
import { ListOrdered, Mic, PhoneOutgoing, PlugZap, Search } from "lucide-react";

import { registerTool } from "./tool-registry";

export const PHONE_SEARCH_TOOL_TYPE = "tool-search_available_numbers" as const;
export const PHONE_PROVISION_TOOL_TYPE = "tool-provision_phone_number" as const;
export const PHONE_BYO_TOOL_TYPE = "tool-connect_byo_twilio" as const;
export const UNASSIGNED_NUMBERS_TOOL_TYPE = "tool-list_unassigned_numbers" as const;
export const VOICE_ACTIVATE_TOOL_TYPE = "tool-activate_voice_agent" as const;

registerTool(PHONE_SEARCH_TOOL_TYPE, { label: "Searching available numbers", icon: Search });
registerTool(PHONE_PROVISION_TOOL_TYPE, {
  label: "Provisioning phone number",
  icon: PhoneOutgoing,
});
registerTool(PHONE_BYO_TOOL_TYPE, { label: "Connecting your Twilio number", icon: PlugZap });
registerTool(UNASSIGNED_NUMBERS_TOOL_TYPE, {
  label: "Listing your phone numbers",
  icon: ListOrdered,
});
registerTool(VOICE_ACTIVATE_TOOL_TYPE, { label: "Activating voice agent", icon: Mic });

export type PhoneSearchToolPart = ToolUIPart & { type: typeof PHONE_SEARCH_TOOL_TYPE };
export type PhoneProvisionToolPart = ToolUIPart & { type: typeof PHONE_PROVISION_TOOL_TYPE };
export type ByoTwilioToolPart = ToolUIPart & { type: typeof PHONE_BYO_TOOL_TYPE };
export type UnassignedNumbersToolPart = ToolUIPart & { type: typeof UNASSIGNED_NUMBERS_TOOL_TYPE };
export type VoiceActivateToolPart = ToolUIPart & { type: typeof VOICE_ACTIVATE_TOOL_TYPE };

export interface AvailablePhoneNumber {
  readonly phoneNumber: string;
  readonly friendlyName: string;
  readonly locality: string | null;
  readonly region: string | null;
  readonly capabilities: { voice: boolean; sms: boolean; mms: boolean };
  readonly addressRequirements: string;
}

export interface PhoneSearchSuccess {
  readonly ok: true;
  readonly numbers: AvailablePhoneNumber[];
  readonly country: string;
}

export interface PhoneSearchFailure {
  readonly ok: false;
  readonly error: string;
}

export type PhoneSearchOutput = PhoneSearchSuccess | PhoneSearchFailure;

export interface PhoneProvisionSuccess {
  readonly ok: true;
  readonly phoneNumberId: string;
  readonly number: string;
}

export interface PhoneProvisionFailure {
  readonly ok: false;
  readonly error: string;
}

export type PhoneProvisionOutput = PhoneProvisionSuccess | PhoneProvisionFailure;

export function isPhoneSearchPart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof PHONE_SEARCH_TOOL_TYPE } {
  return part.type === PHONE_SEARCH_TOOL_TYPE;
}

export function isPhoneProvisionPart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof PHONE_PROVISION_TOOL_TYPE } {
  return part.type === PHONE_PROVISION_TOOL_TYPE;
}

export function isByoTwilioPart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof PHONE_BYO_TOOL_TYPE } {
  return part.type === PHONE_BYO_TOOL_TYPE;
}

export function readPhoneSearchOutput(part: PhoneSearchToolPart): PhoneSearchOutput | undefined {
  if (part.state !== "output-available") return undefined;
  return part.output as PhoneSearchOutput;
}

export function readPhoneProvisionOutput(
  part: PhoneProvisionToolPart | ByoTwilioToolPart,
): PhoneProvisionOutput | undefined {
  if (part.state !== "output-available") return undefined;
  return part.output as PhoneProvisionOutput;
}

// ── Unassigned phone numbers ──────────────────────────────────────────────────

export interface UnassignedNumber {
  readonly id: string;
  readonly e164: string;
  readonly capabilities: { voice: boolean; sms: boolean; mms: boolean };
}

export interface UnassignedNumbersSuccess {
  readonly ok: true;
  readonly numbers: UnassignedNumber[];
}

export interface UnassignedNumbersFailure {
  readonly ok: false;
  readonly error: string;
}

export type UnassignedNumbersOutput = UnassignedNumbersSuccess | UnassignedNumbersFailure;

export function isUnassignedNumbersPart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof UNASSIGNED_NUMBERS_TOOL_TYPE } {
  return part.type === UNASSIGNED_NUMBERS_TOOL_TYPE;
}

export function readUnassignedNumbersOutput(
  part: UnassignedNumbersToolPart,
): UnassignedNumbersOutput | undefined {
  if (part.state !== "output-available") return undefined;
  return part.output as UnassignedNumbersOutput;
}

// ── Voice agent activation ────────────────────────────────────────────────────

export interface VoiceActivateSuccess {
  readonly ok: true;
  readonly voiceAgentId: string;
  readonly phoneNumber: string;
}

export interface VoiceActivateFailure {
  readonly ok: false;
  readonly error: string;
}

export type VoiceActivateOutput = VoiceActivateSuccess | VoiceActivateFailure;

export function isVoiceActivatePart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof VOICE_ACTIVATE_TOOL_TYPE } {
  return part.type === VOICE_ACTIVATE_TOOL_TYPE;
}

export function readVoiceActivateOutput(
  part: VoiceActivateToolPart,
): VoiceActivateOutput | undefined {
  if (part.state !== "output-available") return undefined;
  return part.output as VoiceActivateOutput;
}
