import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";
import { appError, ErrCode } from "../../lib/errors";
import {
  countPhoneNumbers,
  countVoiceAgents,
  getActiveSubscription,
} from "../billing/repo";

import {
  activateVoiceInput,
  buyNumberInput,
  deactivateVoiceInput,
  getVoiceAgentInput,
  listCallsByPhoneInput,
  listVoiceCallsInput,
  releaseNumberInput,
  searchNumbersInput,
} from "./inputs";
import { voiceService } from "./service";

export const voiceRouter = router({
  // ── Phone numbers ─────────────────────────────────────────────────────────

  searchNumbers: workspaceProc
    .input(searchNumbersInput)
    .query(({ ctx, input }) =>
      voiceService.searchNumbers(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  buyNumber: workspaceProc
    .input(buyNumberInput)
    .mutation(async ({ ctx, input }) => {
      const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
      const limit = sub?.plan.limits.maxPhoneNumbers ?? null;
      if (limit !== null) {
        const used = await countPhoneNumbers(ctx.db, ctx.workspaceId);
        if (used >= limit) {
          throw appError(
            ErrCode.PlanLimitReached,
            "Phone number limit reached. Please upgrade your plan.",
          );
        }
      }
      return voiceService.buyNumber(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      );
    }),

  listNumbers: workspaceProc.query(({ ctx }) =>
    voiceService.listNumbers({
      db: ctx.db,
      workspaceId: ctx.workspaceId,
      userId: ctx.user.id,
    }),
  ),

  releaseNumber: workspaceProc
    .input(releaseNumberInput)
    .mutation(({ ctx, input }) =>
      voiceService.releaseNumber(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  // ── Voice agents ──────────────────────────────────────────────────────────

  activate: workspaceProc
    .input(activateVoiceInput)
    .mutation(async ({ ctx, input }) => {
      const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
      if (sub?.plan.features.voiceAgents === false) {
        throw appError(
          ErrCode.PlanLimitReached,
          "Voice agents are not available on your current plan. Please upgrade.",
        );
      }
      const agentLimit = sub?.plan.limits.maxVoiceAgents ?? null;
      if (agentLimit !== null) {
        const used = await countVoiceAgents(ctx.db, ctx.workspaceId);
        if (used >= agentLimit) {
          throw appError(
            ErrCode.PlanLimitReached,
            "Voice agent limit reached. Please upgrade your plan.",
          );
        }
      }
      return voiceService.activate(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      );
    }),

  deactivate: workspaceProc
    .input(deactivateVoiceInput)
    .mutation(({ ctx, input }) =>
      voiceService.deactivate(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  list: workspaceProc.query(({ ctx }) =>
    voiceService.list({
      db: ctx.db,
      workspaceId: ctx.workspaceId,
      userId: ctx.user.id,
    }),
  ),

  get: workspaceProc
    .input(getVoiceAgentInput)
    .query(({ ctx, input }) =>
      voiceService.get(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  listCalls: workspaceProc
    .input(listVoiceCallsInput)
    .query(({ ctx, input }) =>
      voiceService.listCalls(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  listCallsByPhone: workspaceProc
    .input(listCallsByPhoneInput)
    .query(({ ctx, input }) =>
      voiceService.listCallsByPhone(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),
});
