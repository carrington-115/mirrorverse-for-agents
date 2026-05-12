import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { ensureUserWorkspace } from "../tenancy/repo";

import * as repo from "./repo";
import type { GetWorkflowInput, ListWorkflowsInput } from "./inputs";

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
};
