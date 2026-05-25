import type { Database } from "@mirrorverse/db";

import { appError, ErrCode } from "../../lib/errors";

import * as repo from "./repo";
import type {
  DeleteWorkflowInput,
  GetWorkflowInput,
  GetWorkflowVersionInput,
  ListWorkflowVersionsInput,
  ListWorkflowsInput,
  RenameWorkflowInput,
  ReorderWorkflowsInput,
  SaveWorkflowVersionInput,
} from "./inputs";

interface WorkspaceCtx {
  readonly db: Database;
  readonly workspaceId: string;
  readonly userId: string;
}

export const workflowsService = {
  async list(ctx: WorkspaceCtx, input: ListWorkflowsInput) {
    return repo.listWorkflowsForWorkspace(ctx.db, ctx.workspaceId, input.limit);
  },

  async get(ctx: WorkspaceCtx, input: GetWorkflowInput) {
    const workflow = await repo.getWorkflowForWorkspace(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
    );
    if (!workflow) return { workflow: null, version: null, originChatId: null };
    const [version, originChatId] = await Promise.all([
      repo.getLatestVersion(ctx.db, workflow.id, ctx.workspaceId),
      repo.getOriginChatId(ctx.db, workflow.id, ctx.workspaceId),
    ]);
    return { workflow, version, originChatId };
  },

  async delete(ctx: WorkspaceCtx, input: DeleteWorkflowInput) {
    const ok = await repo.deleteWorkflowForWorkspace(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
    );
    if (!ok) throw appError(ErrCode.NotFound, "Workflow not found");
    return { id: input.workflowId };
  },

  async rename(ctx: WorkspaceCtx, input: RenameWorkflowInput) {
    const trimmed = input.name.trim();
    if (trimmed.length === 0) {
      throw appError(ErrCode.BadInput, "Name cannot be empty");
    }
    const row = await repo.renameWorkflowForWorkspace(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
      trimmed,
    );
    if (!row) throw appError(ErrCode.NotFound, "Workflow not found");
    return row;
  },

  async reorder(ctx: WorkspaceCtx, input: ReorderWorkflowsInput) {
    const updated = await repo.updateWorkflowSortOrders(
      ctx.db,
      ctx.workspaceId,
      input.workflowIds,
    );
    return { updated };
  },

  async listVersions(ctx: WorkspaceCtx, input: ListWorkflowVersionsInput) {
    const workflow = await repo.getWorkflowForWorkspace(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
    );
    if (!workflow) throw appError(ErrCode.NotFound, "Workflow not found");
    const versions = await repo.listVersionsForWorkflow(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
    );
    return { workflow, versions };
  },

  async getVersion(ctx: WorkspaceCtx, input: GetWorkflowVersionInput) {
    const version = await repo.getVersionByNumber(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
      input.versionNumber,
    );
    if (!version) throw appError(ErrCode.NotFound, "Version not found");
    return { version };
  },

  async saveVersion(ctx: WorkspaceCtx, input: SaveWorkflowVersionInput) {
    const result = await repo.saveWorkflowVersionForWorkspace(
      ctx.db,
      ctx.workspaceId,
      input.workflowId,
      ctx.userId,
      input.document,
      input.summary ?? "Edited via canvas",
    );
    if (!result) throw appError(ErrCode.NotFound, "Workflow not found");
    return result;
  },
};
