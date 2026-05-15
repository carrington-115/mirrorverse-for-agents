import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { appError, ErrCode } from "../../lib/errors";
import { ensureUserWorkspace } from "../tenancy/repo";

import * as repo from "./repo";
import type {
  DeleteWorkflowInput,
  GetWorkflowInput,
  ListWorkflowsInput,
  ReorderWorkflowsInput,
} from "./inputs";

interface BaseCtx {
  readonly db: Database;
  readonly userId: UserId;
}

export const workflowsService = {
  async list(ctx: BaseCtx, input: ListWorkflowsInput) {
    const workspaceId = await ensureUserWorkspace(ctx.db, ctx.userId);
    return repo.listWorkflowsForWorkspace(ctx.db, workspaceId, input.limit);
  },

  async get(ctx: BaseCtx, input: GetWorkflowInput) {
    const workspaceId = await ensureUserWorkspace(ctx.db, ctx.userId);
    const workflow = await repo.getWorkflowForWorkspace(
      ctx.db,
      input.workflowId,
      workspaceId,
    );
    if (!workflow) return { workflow: null, version: null };
    const version = await repo.getLatestVersion(
      ctx.db,
      workflow.id,
      workspaceId,
    );
    return { workflow, version };
  },

  async delete(ctx: BaseCtx, input: DeleteWorkflowInput) {
    const workspaceId = await ensureUserWorkspace(ctx.db, ctx.userId);
    const ok = await repo.deleteWorkflowForWorkspace(
      ctx.db,
      input.workflowId,
      workspaceId,
    );
    if (!ok) throw appError(ErrCode.NotFound, "Workflow not found");
    return { id: input.workflowId };
  },

  async reorder(ctx: BaseCtx, input: ReorderWorkflowsInput) {
    const workspaceId = await ensureUserWorkspace(ctx.db, ctx.userId);
    const updated = await repo.updateWorkflowSortOrders(
      ctx.db,
      workspaceId,
      input.workflowIds,
    );
    return { updated };
  },
};
