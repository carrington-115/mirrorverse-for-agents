import type { ToolUIPart } from "ai";

export const PHONE_SEARCH_TOOL_TYPE = "tool-search_available_numbers" as const;
export const PHONE_PROVISION_TOOL_TYPE = "tool-provision_phone_number" as const;
export const PHONE_BYO_TOOL_TYPE = "tool-connect_byo_twilio" as const;

export type PhoneSearchToolPart = ToolUIPart & { type: typeof PHONE_SEARCH_TOOL_TYPE };
export type PhoneProvisionToolPart = ToolUIPart & { type: typeof PHONE_PROVISION_TOOL_TYPE };
export type ByoTwilioToolPart = ToolUIPart & { type: typeof PHONE_BYO_TOOL_TYPE };

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
