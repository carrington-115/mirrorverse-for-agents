import type { Database } from "@mirrorverse/db";
import { schema, eq } from "@mirrorverse/db";
import { env } from "@mirrorverse/env/backend";

import { appError, ErrCode } from "../../lib/errors.js";

import { compileToVapiAssistant } from "./compile.js";
import {
  createAssistant,
  deleteAssistant,
  importTwilioNumber,
  bindAssistantToNumber,
  unbindAssistantFromNumber,
  deleteVapiPhoneNumber,
} from "./providers/vapi.js";
import {
  loadTwilioCreds,
  searchAvailableNumbers,
  purchaseNumber,
  fetchAndConfigureExistingNumber,
  releaseNumber as releaseTwilioNumber,
  TwilioNumberRaceError,
  type TwilioCreds,
} from "./providers/twilio.js";
import * as repo from "./repo.js";
import type { VoiceAgentNode } from "@mirrorverse/types";

import type {
  SearchNumbersInput,
  BuyNumberInput,
  ReleaseNumberInput,
  ActivateVoiceInput,
  DeactivateVoiceInput,
  GetVoiceAgentInput,
  ListVoiceCallsInput,
  ListCallsByPhoneInput,
} from "./inputs.js";

interface WorkspaceCtx {
  readonly db: Database;
  readonly workspaceId: string;
  readonly userId: string;
}

export const voiceService = {
  // ── Phone numbers ─────────────────────────────────────────────────────────

  async searchNumbers(ctx: WorkspaceCtx, input: SearchNumbersInput) {
    const creds = await loadTwilioCreds(
      ctx.db,
      input.source,
      input.connectionId ?? null,
    );
    return searchAvailableNumbers(creds, {
      countryCode: input.countryCode,
      areaCode: input.areaCode,
      contains: input.contains,
      voiceEnabled: input.voiceEnabled,
      limit: input.limit,
    });
  },

  async buyNumber(ctx: WorkspaceCtx, input: BuyNumberInput) {
    const creds = await loadTwilioCreds(
      ctx.db,
      input.source,
      input.connectionId ?? null,
    );
    const webhookBaseUrl = env.BACKEND_URL;

    let twilioResult;
    try {
      twilioResult = await purchaseNumber(
        creds,
        input.phoneNumber,
        webhookBaseUrl,
      );
    } catch (err) {
      if (err instanceof TwilioNumberRaceError) {
        throw appError(ErrCode.Conflict, "number_taken");
      }
      throw err;
    }

    const vapiNumber = await importTwilioNumber(twilioResult.e164, creds);

    return repo.insertPhoneNumber(ctx.db, {
      workspaceId: ctx.workspaceId,
      e164: twilioResult.e164,
      twilioSid: twilioResult.twilioSid,
      vapiPhoneNumberId: vapiNumber.id,
      source: input.source,
      connectionId: input.connectionId ?? null,
      status: "active",
      capabilities: twilioResult.capabilities,
      monthlyCostCents: 100,
    });
  },

  async listNumbers(ctx: WorkspaceCtx) {
    return repo.listPhoneNumbers(ctx.db, ctx.workspaceId);
  },

  async releaseNumber(ctx: WorkspaceCtx, input: ReleaseNumberInput) {
    const num = await repo.getPhoneNumber(
      ctx.db,
      ctx.workspaceId,
      input.phoneNumberId,
    );
    if (!num) throw appError(ErrCode.NotFound, "Phone number not found");

    const creds = await loadTwilioCreds(
      ctx.db,
      num.source as "managed" | "byo",
      num.connectionId,
      num.byoTwilioCredId,
    );
    await unbindAssistantFromNumber(num.vapiPhoneNumberId);
    await deleteVapiPhoneNumber(num.vapiPhoneNumberId);
    await releaseTwilioNumber(creds, num.twilioSid);
    await repo.updatePhoneNumber(ctx.db, input.phoneNumberId, {
      status: "released",
      releasedAt: new Date(),
      voiceAgentId: null,
    });

    return { id: input.phoneNumberId };
  },

  // ── Voice agents ──────────────────────────────────────────────────────────

  async activate(ctx: WorkspaceCtx, input: ActivateVoiceInput) {
    const phoneNum = await repo.getPhoneNumber(
      ctx.db,
      ctx.workspaceId,
      input.phoneNumberId,
    );
    if (!phoneNum) throw appError(ErrCode.NotFound, "Phone number not found");
    if (phoneNum.voiceAgentId) {
      throw appError(
        ErrCode.Conflict,
        "Phone number is already assigned to a voice agent",
      );
    }

    const [workflow] = await ctx.db
      .select()
      .from(schema.workflows)
      .where(eq(schema.workflows.id, input.workflowId))
      .limit(1);

    if (!workflow || workflow.workspaceId !== ctx.workspaceId) {
      throw appError(ErrCode.NotFound, "Workflow not found");
    }
    if (workflow.kind !== "voice-agent") {
      throw appError(ErrCode.BadInput, "Workflow is not a voice-agent");
    }
    if (!workflow.currentVersionId) {
      throw appError(ErrCode.BadInput, "Workflow has no current version");
    }

    const [version] = await ctx.db
      .select()
      .from(schema.workflowVersions)
      .where(eq(schema.workflowVersions.id, workflow.currentVersionId))
      .limit(1);

    if (!version) {
      throw appError(ErrCode.NotFound, "Workflow version not found");
    }

    const voiceNodeRaw = version.document.nodes.find(
      (n) => n.type === "ai.voice_agent",
    );
    if (!voiceNodeRaw) {
      throw appError(ErrCode.BadInput, "Workflow has no voice agent node");
    }
    // All voice-agent config lives in params; cast to the typed interface.
    const voiceNode = voiceNodeRaw.params as unknown as VoiceAgentNode;

    const webhookUrl = `${env.BACKEND_URL}/api/voice/webhook`;
    const payload = compileToVapiAssistant(
      voiceNode,
      webhookUrl,
      workflow.name,
    );
    const assistant = await createAssistant(payload);

    await bindAssistantToNumber(phoneNum.vapiPhoneNumberId, assistant.id);

    const voiceAgent = await repo.insertVoiceAgent(ctx.db, {
      workspaceId: ctx.workspaceId,
      workflowId: input.workflowId,
      workflowVersionId: version.id,
      provider: "vapi",
      direction: voiceNode.direction,
      externalAssistantId: assistant.id,
      voiceId: voiceNode.voiceEntry.voiceId,
      model: voiceNode.modelConnection.model,
      systemPrompt: voiceNode.modelConnection.systemPrompt,
      firstMessage: voiceNode.firstMessage,
      endCallPhrases: voiceNode.endCallPhrases as string[],
      maxDurationSec: voiceNode.maxDurationSec,
      enabled: true,
      voiceConfig: voiceNode,
    });

    await repo.updatePhoneNumber(ctx.db, input.phoneNumberId, {
      voiceAgentId: voiceAgent.id,
    });

    await ctx.db
      .insert(schema.usageEvents)
      .values({
        workspaceId: ctx.workspaceId,
        kind: "phone_number_month",
        quantity: 1,
        unit: "number",
        costCents: phoneNum.monthlyCostCents,
        billable: true,
        idempotencyKey: `phone_activate:${voiceAgent.id}:${new Date().toISOString().slice(0, 7)}`,
      })
      .onConflictDoNothing();

    await ctx.db
      .update(schema.workflows)
      .set({ status: "active" })
      .where(eq(schema.workflows.id, input.workflowId));

    return { voiceAgentId: voiceAgent.id };
  },

  async deactivate(ctx: WorkspaceCtx, input: DeactivateVoiceInput) {
    const agent = await repo.getVoiceAgentByWorkflow(
      ctx.db,
      ctx.workspaceId,
      input.workflowId,
    );
    if (!agent) throw appError(ErrCode.NotFound, "Voice agent not found");

    await deleteAssistant(agent.externalAssistantId);

    const nums = await ctx.db
      .select()
      .from(schema.phoneNumbers)
      .where(eq(schema.phoneNumbers.voiceAgentId, agent.id));

    for (const num of nums) {
      await repo.updatePhoneNumber(ctx.db, num.id, { voiceAgentId: null });
    }

    await repo.updateVoiceAgent(ctx.db, agent.id, { enabled: false });

    await ctx.db
      .update(schema.workflows)
      .set({ status: "paused" })
      .where(eq(schema.workflows.id, input.workflowId));

    return { workflowId: input.workflowId };
  },

  async list(ctx: WorkspaceCtx) {
    return repo.listVoiceAgents(ctx.db, ctx.workspaceId);
  },

  async get(ctx: WorkspaceCtx, input: GetVoiceAgentInput) {
    const [agent] = await ctx.db
      .select()
      .from(schema.voiceAgents)
      .where(eq(schema.voiceAgents.id, input.voiceAgentId))
      .limit(1);

    if (!agent || agent.workspaceId !== ctx.workspaceId) {
      throw appError(ErrCode.NotFound, "Voice agent not found");
    }

    const phones = await ctx.db
      .select()
      .from(schema.phoneNumbers)
      .where(eq(schema.phoneNumbers.voiceAgentId, agent.id));

    return { agent, phoneNumbers: phones };
  },

  async listCalls(ctx: WorkspaceCtx, input: ListVoiceCallsInput) {
    return repo.listVoiceCalls(
      ctx.db,
      ctx.workspaceId,
      input.voiceAgentId,
      input.limit,
    );
  },

  async listCallsByPhone(ctx: WorkspaceCtx, input: ListCallsByPhoneInput) {
    return repo.listVoiceCallsByPhone(
      ctx.db,
      ctx.workspaceId,
      input.phoneNumberId,
      input.limit,
    );
  },
};

export async function connectByoTwilio(
  ctx: WorkspaceCtx,
  input: { accountSid: string; authToken: string; phoneNumber: string },
) {
  const creds: TwilioCreds = {
    accountSid: input.accountSid,
    authToken: input.authToken,
  };
  const webhookBaseUrl = env.BACKEND_URL;

  const twilioResult = await fetchAndConfigureExistingNumber(
    creds,
    input.phoneNumber,
    webhookBaseUrl,
  );

  const vapiNumber = await importTwilioNumber(twilioResult.e164, creds);

  const [credRow] = await ctx.db
    .insert(schema.voiceTwilioCreds)
    .values({
      workspaceId: ctx.workspaceId,
      credentialEncrypted: JSON.stringify({
        accountSid: input.accountSid,
        authToken: input.authToken,
      }),
    })
    .returning();

  return repo.insertPhoneNumber(ctx.db, {
    workspaceId: ctx.workspaceId,
    e164: twilioResult.e164,
    twilioSid: twilioResult.twilioSid,
    vapiPhoneNumberId: vapiNumber.id,
    source: "byo",
    connectionId: null,
    byoTwilioCredId: credRow!.id,
    status: "active",
    capabilities: twilioResult.capabilities,
    monthlyCostCents: 0,
  });
}
