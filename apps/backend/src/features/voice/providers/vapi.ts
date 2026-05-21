import { VapiClient } from "@vapi-ai/server-sdk";
import type { Vapi } from "@vapi-ai/server-sdk";

import { env } from "@mirrorverse/env/backend";

import type { TwilioCreds } from "./twilio";

function getClient(): VapiClient {
  return new VapiClient({ token: env.VAPI_API_KEY ?? "" });
}

export type VapiAssistantPayload = Vapi.CreateAssistantDto;

export async function createAssistant(
  payload: VapiAssistantPayload,
): Promise<{ id: string }> {
  const client = getClient();
  const result = await client.assistants.create(payload);
  return { id: result.id };
}

export async function deleteAssistant(id: string): Promise<void> {
  const client = getClient();
  await client.assistants.delete({ id });
}

export async function importTwilioNumber(
  e164: string,
  creds: TwilioCreds,
): Promise<{ id: string }> {
  const client = getClient();
  const payload: Vapi.CreatePhoneNumbersRequest = {
    provider: "twilio",
    number: e164,
    twilioAccountSid: creds.accountSid,
    ...(creds.apiKey && creds.apiSecret
      ? { twilioApiKey: creds.apiKey, twilioApiSecret: creds.apiSecret }
      : { twilioAuthToken: creds.authToken ?? "" }),
  };
  const result = await client.phoneNumbers.create(payload);
  const r = result as { id?: string };
  return { id: r.id ?? "" };
}

export async function bindAssistantToNumber(
  vapiPhoneNumberId: string,
  assistantId: string,
): Promise<void> {
  const client = getClient();
  await client.phoneNumbers.update({
    id: vapiPhoneNumberId,
    body: {
      provider: "twilio",
      assistantId,
    } as Vapi.UpdatePhoneNumbersRequestBody,
  });
}

export async function unbindAssistantFromNumber(
  vapiPhoneNumberId: string,
): Promise<void> {
  const client = getClient();
  await client.phoneNumbers.update({
    id: vapiPhoneNumberId,
    body: {
      provider: "twilio",
      assistantId: undefined,
    } as Vapi.UpdatePhoneNumbersRequestBody,
  });
}

export async function deleteVapiPhoneNumber(
  vapiPhoneNumberId: string,
): Promise<void> {
  const client = getClient();
  await client.phoneNumbers.delete({ id: vapiPhoneNumberId });
}
