import Twilio from "twilio";

import { env } from "@mirrorverse/env/backend";
import type { Database } from "@mirrorverse/db";
import { eq } from "@mirrorverse/db";
import { schema } from "@mirrorverse/db";

export interface TwilioCreds {
  accountSid: string;
  authToken?: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string | null;
  region: string | null;
  capabilities: { voice: boolean; sms: boolean; mms: boolean };
  addressRequirements: string;
}

export interface PurchasedNumber {
  twilioSid: string;
  e164: string;
  capabilities: { voice: boolean; sms: boolean; mms: boolean };
}

export class TwilioNumberRaceError extends Error {
  readonly code = 21452;
  constructor(phoneNumber: string) {
    super(`Phone number ${phoneNumber} is no longer available`);
    this.name = "TwilioNumberRaceError";
  }
}

function makeTwilioClient(creds: TwilioCreds): ReturnType<typeof Twilio> {
  if (creds.apiKey && creds.apiSecret) {
    return Twilio(creds.apiKey, creds.apiSecret, {
      accountSid: creds.accountSid,
    });
  }
  return Twilio(creds.accountSid, creds.authToken!);
}

export async function loadTwilioCreds(
  db: Database,
  source: "managed" | "byo",
  connectionId: string | null,
): Promise<TwilioCreds> {
  if (source === "managed") {
    return {
      accountSid: env.TWILIO_ACCOUNT_SID!,
      authToken: env.TWILIO_AUTH_TOKEN!,
    };
  }

  if (!connectionId) {
    throw new Error("connectionId is required for BYO Twilio source");
  }

  const [conn] = await db
    .select()
    .from(schema.connections)
    .where(eq(schema.connections.id, connectionId))
    .limit(1);

  if (!conn?.credentialEncrypted) {
    throw new Error("Twilio connection not found or has no credentials");
  }

  const parsed = JSON.parse(conn.credentialEncrypted) as {
    accountSid: string;
    apiKey?: string;
    apiSecret?: string;
    authToken?: string;
  };
  return parsed;
}

export async function searchAvailableNumbers(
  creds: TwilioCreds,
  params: {
    countryCode: string;
    areaCode?: number;
    contains?: string;
    voiceEnabled?: boolean;
    smsEnabled?: boolean;
    limit?: number;
  },
): Promise<AvailableNumber[]> {
  const client = makeTwilioClient(creds);
  const results = await client
    .availablePhoneNumbers(params.countryCode)
    .local.list({
      areaCode: params.areaCode,
      contains: params.contains,
      voiceEnabled: params.voiceEnabled ?? true,
      smsEnabled: params.smsEnabled,
      limit: params.limit ?? 10,
    });

  return results.map((r) => ({
    phoneNumber: r.phoneNumber,
    friendlyName: r.friendlyName,
    locality: r.locality ?? null,
    region: r.region ?? null,
    capabilities: {
      voice: r.capabilities.voice ?? false,
      sms: r.capabilities.sms ?? false,
      mms: r.capabilities.mms ?? false,
    },
    addressRequirements: r.addressRequirements,
  }));
}

export async function purchaseNumber(
  creds: TwilioCreds,
  phoneNumber: string,
  webhookBaseUrl: string,
): Promise<PurchasedNumber> {
  const client = makeTwilioClient(creds);

  try {
    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl: `${webhookBaseUrl}/api/voice/webhook`,
      statusCallback: `${webhookBaseUrl}/api/voice/webhook`,
    });

    return {
      twilioSid: purchased.sid,
      e164: purchased.phoneNumber,
      capabilities: {
        voice: purchased.capabilities?.voice ?? false,
        sms: purchased.capabilities?.sms ?? false,
        mms: purchased.capabilities?.mms ?? false,
      },
    };
  } catch (err: unknown) {
    const twilioErr = err as { code?: number; message?: string };
    if (twilioErr.code === 21452) {
      throw new TwilioNumberRaceError(phoneNumber);
    }
    throw err;
  }
}

export async function releaseNumber(
  creds: TwilioCreds,
  twilioSid: string,
): Promise<void> {
  const client = makeTwilioClient(creds);
  await client.incomingPhoneNumbers(twilioSid).remove();
}
