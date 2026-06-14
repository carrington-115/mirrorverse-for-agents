import type { Database } from "@mirrorverse/db";

import { appError, ErrCode } from "../../lib/errors";
import { inngest } from "../inngest/client";
import { workflowExecuteEvent } from "../inngest/events";
import {
  createOrReactivateEndpoint,
  disableEndpointsByWorkflowId,
} from "../webhooks/webhook-endpoints-repo";
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
    const rows = await repo.listWorkflowsForWorkspace(
      ctx.db,
      ctx.workspaceId,
      input.limit,
    );
    const activity = await repo.getWorkflowActivityCounts(
      ctx.db,
      ctx.workspaceId,
      rows.map((row) => row.id),
    );
    return rows.map((row) => ({
      ...row,
      activity: activity.get(row.id) ?? [],
    }));
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

  async activate(ctx: WorkspaceCtx, input: { workflowId: string }) {
    const [workflow, version] = await Promise.all([
      repo.getWorkflowForWorkspace(ctx.db, input.workflowId, ctx.workspaceId),
      repo.getLatestVersion(ctx.db, input.workflowId, ctx.workspaceId),
    ]);
    if (!workflow) throw appError(ErrCode.NotFound, "Workflow not found");
    if (!version)
      throw appError(ErrCode.BadInput, "Save the workflow before activating");

    const webhookNodes = version.document.nodes.filter(
      (n) => n.type === "trigger.webhook",
    );

    const endpoints = await Promise.all(
      webhookNodes.map((node) => {
        const slug =
          typeof node.params.endpointSlug === "string"
            ? node.params.endpointSlug
            : "";
        const verifySignature = node.params.verifySignature === true;
        if (!slug) return null;
        return createOrReactivateEndpoint(
          ctx.db,
          ctx.workspaceId,
          input.workflowId,
          node.id,
          slug,
          verifySignature,
        );
      }),
    );

    await repo.setWorkflowStatus(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
      "active",
    );

    return {
      workflowId: input.workflowId,
      endpoints: endpoints.filter(Boolean),
    };
  },

  async deactivate(ctx: WorkspaceCtx, input: { workflowId: string }) {
    const workflow = await repo.getWorkflowForWorkspace(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
    );
    if (!workflow) throw appError(ErrCode.NotFound, "Workflow not found");

    await Promise.all([
      disableEndpointsByWorkflowId(ctx.db, ctx.workspaceId, input.workflowId),
      repo.setWorkflowStatus(
        ctx.db,
        input.workflowId,
        ctx.workspaceId,
        "paused",
      ),
    ]);

    return { workflowId: input.workflowId };
  },

  async setSlackAgent(
    ctx: WorkspaceCtx,
    input: { workflowId: string; enabled: boolean },
  ) {
    const workflow = await repo.getWorkflowForWorkspace(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
    );
    if (!workflow) throw appError(ErrCode.NotFound, "Workflow not found");

    const result = await repo.setSlackAgentWorkflow(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
      input.enabled,
    );
    if (!result) throw appError(ErrCode.NotFound, "Workflow not found");

    return result;
  },

  // Dispatch a one-off manual run via Inngest without changing workflow status.
  async run(ctx: WorkspaceCtx, input: { workflowId: string }) {
    const [workflow, version] = await Promise.all([
      repo.getWorkflowForWorkspace(ctx.db, input.workflowId, ctx.workspaceId),
      repo.getLatestVersion(ctx.db, input.workflowId, ctx.workspaceId),
    ]);
    if (!workflow) throw appError(ErrCode.NotFound, "Workflow not found");
    if (!version)
      throw appError(ErrCode.BadInput, "Workflow has no saved version to run");

    const triggerNode = version.document.nodes.find((n) =>
      n.type.startsWith("trigger."),
    );
    if (!triggerNode)
      throw appError(ErrCode.BadInput, "Workflow has no trigger node");

    await inngest.send(
      workflowExecuteEvent.create({
        workspaceId: ctx.workspaceId,
        workflowId: input.workflowId,
        workflowVersionId: version.id,
        triggerNodeId: triggerNode.id,
        triggerKind: "manual",
        triggerPayload: {},
        initiatedBy: ctx.userId,
      }),
    );

    return { ok: true as const };
  },

  // Re-register all triggers by cycling deactivate → activate.
  // Only active workflows need this; inactive/draft workflows should be activated normally.
  async restart(ctx: WorkspaceCtx, input: { workflowId: string }) {
    const workflow = await repo.getWorkflowForWorkspace(
      ctx.db,
      input.workflowId,
      ctx.workspaceId,
    );
    if (!workflow) throw appError(ErrCode.NotFound, "Workflow not found");
    if (workflow.status !== "active")
      throw appError(
        ErrCode.BadInput,
        "Only active workflows can be restarted. Activate the workflow first.",
      );

    await workflowsService.deactivate(ctx, input);
    return workflowsService.activate(ctx, input);
  },
};
