import { z } from "zod";

import { router } from "../../trpc/init.js";
import { workspaceProc } from "../../trpc/middleware.js";

import {
  deleteWorkflowInput,
  getWorkflowInput,
  getWorkflowVersionInput,
  listWorkflowVersionsInput,
  listWorkflowsInput,
  renameWorkflowInput,
  reorderWorkflowsInput,
  saveWorkflowVersionInput,
} from "./inputs.js";
import { workflowsService } from "./service.js";

const workflowIdInput = z.object({ workflowId: z.string().min(1).max(128) });

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

  deactivate: workspaceProc
    .input(workflowIdInput)
    .mutation(({ ctx, input }) =>
      workflowsService.deactivate(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),
});
