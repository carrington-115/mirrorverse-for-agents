import { tool } from "ai";
import { z } from "zod";
import type { Tool } from "ai";
import { and, eq, isNull } from "@mirrorverse/db";
import type { Database } from "@mirrorverse/db";
import { schema } from "@mirrorverse/db";

import {
  voiceService,
  connectByoTwilio as connectByoTwilioService,
} from "./service.js";

interface PhoneToolCtx {
  readonly db: Database;
  readonly workspaceId: string;
  readonly userId: string;
}

const MAX_ERROR_LENGTH = 300;

function safeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.slice(0, MAX_ERROR_LENGTH);
}

export function buildPhoneTools(ctx: PhoneToolCtx): Record<string, Tool> {
  const searchAvailableNumbers = tool({
    description:
      "Search for available phone numbers in a given country. Call this when the user wants to get a new phone number from Mirrorverse. Returns up to 10 numbers the user can choose from.",
    inputSchema: z.object({
      country: z
        .string()
        .length(2)
        .describe(
          "ISO 3166-1 alpha-2 country code (e.g. US, GB, AU, DE, FR, CA)",
        ),
      areaCode: z
        .string()
        .optional()
        .describe(
          "Area code to filter by, e.g. '415'. Applies to North American numbers.",
        ),
      contains: z
        .string()
        .max(10)
        .optional()
        .describe("Digits the number should contain, e.g. '1234'."),
    }),
    execute: async ({ country, areaCode, contains }) => {
      try {
        const numbers = await voiceService.searchNumbers(ctx, {
          countryCode: country.toUpperCase(),
          areaCode: areaCode ? parseInt(areaCode, 10) : undefined,
          contains,
          voiceEnabled: true,
          limit: 10,
          source: "managed",
        });
        return { ok: true as const, numbers, country: country.toUpperCase() };
      } catch (err) {
        return { ok: false as const, error: safeError(err) };
      }
    },
  });

  const provisionPhoneNumber = tool({
    description:
      "Purchase and provision a phone number the user selected from search_available_numbers results. Call this once the user has chosen a specific number.",
    inputSchema: z.object({
      phoneNumber: z
        .string()
        .regex(/^\+\d{10,15}$/)
        .describe(
          "The E.164 formatted phone number to provision, e.g. +14155552671",
        ),
    }),
    execute: async ({ phoneNumber }) => {
      try {
        const result = await voiceService.buyNumber(ctx, {
          phoneNumber,
          source: "managed",
        });
        return {
          ok: true as const,
          phoneNumberId: result.id,
          number: result.e164,
        };
      } catch (err) {
        return { ok: false as const, error: safeError(err) };
      }
    },
  });

  const connectByoTwilio = tool({
    description:
      "Connect a phone number from the user's own Twilio account using their credentials. Use this when the user asks to connect their own Twilio account or import their existing Twilio number.",
    inputSchema: z.object({
      accountSid: z.string().describe("Twilio Account SID, starts with AC"),
      authToken: z.string().describe("Twilio Auth Token"),
      phoneNumber: z
        .string()
        .regex(/^\+\d{10,15}$/)
        .describe(
          "The E.164 formatted phone number the user has purchased in their Twilio console, e.g. +14155552671",
        ),
    }),
    execute: async ({ accountSid, authToken, phoneNumber }) => {
      try {
        const result = await connectByoTwilioService(ctx, {
          accountSid,
          authToken,
          phoneNumber,
        });
        return {
          ok: true as const,
          phoneNumberId: result.id,
          number: result.e164,
        };
      } catch (err) {
        return { ok: false as const, error: safeError(err) };
      }
    },
  });

  const listUnassignedNumbers = tool({
    description:
      "List phone numbers in this workspace that are not yet assigned to a voice agent. Call this when the user wants to assign a phone number to a voice agent.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const numbers = await ctx.db
          .select({
            id: schema.phoneNumbers.id,
            e164: schema.phoneNumbers.e164,
            capabilities: schema.phoneNumbers.capabilities,
          })
          .from(schema.phoneNumbers)
          .where(
            and(
              eq(schema.phoneNumbers.workspaceId, ctx.workspaceId),
              eq(schema.phoneNumbers.status, "active"),
              isNull(schema.phoneNumbers.voiceAgentId),
            ),
          );
        return { ok: true as const, numbers };
      } catch (err) {
        return { ok: false as const, error: safeError(err) };
      }
    },
  });

  const activateVoiceAgent = tool({
    description:
      "Activate a voice agent workflow on a specific phone number. Call this once the user has selected a phone number for their voice agent.",
    inputSchema: z.object({
      workflowId: z
        .string()
        .describe("The voice-agent workflow ID to activate"),
      phoneNumberId: z
        .string()
        .describe("The phone number ID to assign the voice agent to"),
    }),
    execute: async ({ workflowId, phoneNumberId }) => {
      try {
        const result = await voiceService.activate(ctx, {
          workflowId,
          phoneNumberId,
        });
        const [phone] = await ctx.db
          .select({ e164: schema.phoneNumbers.e164 })
          .from(schema.phoneNumbers)
          .where(eq(schema.phoneNumbers.id, phoneNumberId))
          .limit(1);
        return {
          ok: true as const,
          voiceAgentId: result.voiceAgentId,
          phoneNumber: phone?.e164 ?? phoneNumberId,
        };
      } catch (err) {
        return { ok: false as const, error: safeError(err) };
      }
    },
  });

  return {
    search_available_numbers: searchAvailableNumbers,
    provision_phone_number: provisionPhoneNumber,
    connect_byo_twilio: connectByoTwilio,
    list_unassigned_numbers: listUnassignedNumbers,
    activate_voice_agent: activateVoiceAgent,
  };
}
