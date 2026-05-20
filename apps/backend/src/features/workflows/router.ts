import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";

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
});
