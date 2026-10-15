import { z } from "zod";

import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";
import { appError, ErrCode } from "../../lib/errors";

import {
  deleteWorkflowInput,
  getWorkflowInput,
  getWorkflowVersionInput,
  listWorkflowVersionsInput,
  listWorkflowsInput,
  renameWorkflowInput,
  reorderWorkflowsInput,
  saveWorkflowVersionInput,
} from "./inputs";
import { workflowsService } from "./service";
import {
  countRunsThisPeriod,
  countRunsToday,
  getActiveSubscription,
} from "../billing/repo";

const workflowIdInput = z.object({ workflowId: z.string().min(1).max(128) });
const setSlackAgentInput = workflowIdInput.extend({ enabled: z.boolean() });
const deployVersionInput = workflowIdInput.extend({
  versionNumber: z.number().int().positive(),
});

export const workflowsRouter = router({
  list: workspaceProc
    .input(listWorkflowsInput)
    .query(({ ctx, input }) =>
      workflowsService.list(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  get: workspaceProc
    .input(getWorkflowInput)
    .query(({ ctx, input }) =>
      workflowsService.get(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  listVersions: workspaceProc
    .input(listWorkflowVersionsInput)
    .query(({ ctx, input }) =>
      workflowsService.listVersions(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  getVersion: workspaceProc
    .input(getWorkflowVersionInput)
    .query(({ ctx, input }) =>
      workflowsService.getVersion(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  saveVersion: workspaceProc
    .input(saveWorkflowVersionInput)
    .mutation(({ ctx, input }) =>
      workflowsService.saveVersion(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  delete: workspaceProc
    .input(deleteWorkflowInput)
    .mutation(({ ctx, input }) =>
      workflowsService.delete(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  rename: workspaceProc
    .input(renameWorkflowInput)
    .mutation(({ ctx, input }) =>
      workflowsService.rename(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  reorder: workspaceProc
    .input(reorderWorkflowsInput)
    .mutation(({ ctx, input }) =>
      workflowsService.reorder(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  activate: workspaceProc
    .input(workflowIdInput)
    .mutation(({ ctx, input }) =>
      workflowsService.activate(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  deployVersion: workspaceProc
    .input(deployVersionInput)
    .mutation(({ ctx, input }) =>
      workflowsService.deployVersion(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  deactivate: workspaceProc
    .input(workflowIdInput)
    .mutation(({ ctx, input }) =>
      workflowsService.deactivate(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  setSlackAgent: workspaceProc
    .input(setSlackAgentInput)
    .mutation(({ ctx, input }) =>
      workflowsService.setSlackAgent(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  run: workspaceProc.input(workflowIdInput).mutation(async ({ ctx, input }) => {
    const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);

    const dailyLimit = sub?.plan.limits.maxRunsPerDay ?? null;
    if (dailyLimit !== null) {
      const used = await countRunsToday(ctx.db, ctx.workspaceId);
      if (used >= dailyLimit) {
        throw appError(
          ErrCode.PlanLimitReached,
          "Daily run limit reached. Please upgrade your plan.",
        );
      }
    }

    const monthlyLimit = sub?.plan.limits.maxRunsPerMonth ?? null;
    if (monthlyLimit !== null) {
      const periodStart = sub?.subscription.currentPeriodStart ?? new Date(0);
      const used = await countRunsThisPeriod(
        ctx.db,
        ctx.workspaceId,
        periodStart,
      );
      if (used >= monthlyLimit) {
        throw appError(
          ErrCode.PlanLimitReached,
          "Monthly run limit reached. Please upgrade your plan.",
        );
      }
    }

    return workflowsService.run(
      { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
      input,
    );
  }),

  restart: workspaceProc
    .input(workflowIdInput)
    .mutation(({ ctx, input }) =>
      workflowsService.restart(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),
});
