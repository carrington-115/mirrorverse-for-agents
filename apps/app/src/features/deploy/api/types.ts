export type {
  ChannelStatus,
  PhoneNumber,
  EmailChannel,
  CallLog,
  Transcript,
  TranscriptMessage,
} from "@/lib/types";

import type { PhoneNumber, CallLog } from "@/lib/types";

export function mapDbPhoneToFrontend(p: {
  id: string;
  e164: string;
  status: string;
  capabilities: { voice: boolean; sms: boolean; mms: boolean };
  createdAt: Date;
}): PhoneNumber {
  return {
    id: p.id,
    number: p.e164,
    provider: "twilio",
    status: p.status === "active" ? "active" : p.status === "released" ? "inactive" : "pending",
    description: p.e164,
    callType: p.capabilities.voice && p.capabilities.sms ? "All" : "Inbound",
    purpose: "Voice",
    verificationStatus: p.status === "active" ? "verified" : "pending",
    createdAt: new Date(p.createdAt),
  };
}

export function mapDbCallToFrontend(c: {
  id: string;
  phoneNumberId: string | null;
  startedAt: Date;
  fromNumber: string;
  direction: string;
  status: string;
  durationSec: number | null;
}): CallLog {
  return {
    id: c.id,
    phoneNumberId: c.phoneNumberId ?? "",
    dateTime: new Date(c.startedAt),
    callerId: c.fromNumber,
    direction: c.direction === "inbound" ? "Inbound" : "Outbound",
    status: c.status === "completed" ? "Answered" : "Unanswered",
    duration: c.durationSec
      ? `${Math.floor(c.durationSec / 60)}:${String(c.durationSec % 60).padStart(2, "0")}`
      : undefined,
  };
}
