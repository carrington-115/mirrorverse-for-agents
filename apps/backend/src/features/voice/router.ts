import { router } from "../../trpc/init.js";
import { workspaceProc } from "../../trpc/middleware.js";

import {
  activateVoiceInput,
  buyNumberInput,
  deactivateVoiceInput,
  getVoiceAgentInput,
  listCallsByPhoneInput,
  listVoiceCallsInput,
  releaseNumberInput,
  searchNumbersInput,
} from "./inputs.js";
import { voiceService } from "./service.js";

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
    .mutation(({ ctx, input }) =>
      voiceService.buyNumber(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

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
    .mutation(({ ctx, input }) =>
      voiceService.activate(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

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
