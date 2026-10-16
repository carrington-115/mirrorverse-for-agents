import type { Database } from "@mirrorverse/db";

import { appError, ErrCode } from "../../lib/errors";
import { inngest } from "../inngest/client";
import { workflowExecuteEvent } from "../inngest/events";
import type { WorkflowKind } from "@mirrorverse/types";

import {
  createOrReactivateEndpoint,
  disableEndpointsByWorkflowId,
  disableStaleEndpoints,
  listSlugsTakenByOtherWorkflows,
} from "../webhooks/webhook-endpoints-repo";
import { validateDeployDocument } from "./deploy-validation";
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

interface DeployableWorkflow {
  readonly id: string;
  readonly kind: WorkflowKind;
}

type WorkflowVersionRow = NonNullable<
  Awaited<ReturnType<typeof repo.getLatestVersion>>
>;

function webhookSlug(params: Record<string, unknown>): string {
  return typeof params.endpointSlug === "string"
    ? params.endpointSlug.trim()
    : "";
}

function isUniqueViolation(err: unknown): boolean {
  // Drizzle wraps driver errors; walk the cause chain for the PG code.
  let cur: unknown = err;
  for (let i = 0; i < 3 && cur !== null && typeof cur === "object"; i++) {
    if ((cur as { code?: unknown }).code === "23505") return true;
    cur = (cur as { cause?: unknown }).cause;
  }
  return false;
}

async function validateForDeploy(
  ctx: WorkspaceCtx,
  workflow: DeployableWorkflow,
  version: WorkflowVersionRow,
) {
  const slugs = version.document.nodes
    .filter((n) => n.type === "trigger.webhook")
    .map((n) => webhookSlug(n.params))
    .filter(Boolean);
  const [takenWebhookSlugs, connectedAppSlugs, envVarNames] = await Promise.all(
    [
      listSlugsTakenByOtherWorkflows(ctx.db, workflow.id, slugs),
      repo.listConnectedAppSlugs(ctx.db, ctx.workspaceId),
      repo.listEnvVarNames(ctx.db, ctx.workspaceId),
    ],
  );
  const issues = validateDeployDocument(version.document, workflow.kind, {
    takenWebhookSlugs,
    connectedAppSlugs,
    envVarNames,
  });
  const [first] = issues;
  if (first) {
    const more = issues.length > 1 ? ` (+${issues.length - 1} more)` : "";
    throw appError(ErrCode.BadInput, `Can't deploy: ${first.message}${more}`, {
      issues,
    });
  }
}

// Validates `version`, registers its trigger endpoints, then pins it as the
// deployed version and marks the workflow active.
async function deploy(
  ctx: WorkspaceCtx,
  workflow: DeployableWorkflow,
  version: WorkflowVersionRow,
) {
  await validateForDeploy(ctx, workflow, version);

  const webhookNodes = version.document.nodes.filter(
    (n) => n.type === "trigger.webhook",
  );

  let endpoints;
  try {
    endpoints = await Promise.all(
      webhookNodes.map((node) =>
        createOrReactivateEndpoint(
          ctx.db,
          ctx.workspaceId,
          workflow.id,
          node.id,
          webhookSlug(node.params),
          // Signature verification is on unless explicitly disabled.
          node.params.verifySignature !== false,
        ),
      ),
    );
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw appError(
        ErrCode.Conflict,
        "That webhook URL is already used by another workflow. Choose a different slug.",
      );
    }
    throw err;
  }

  await disableStaleEndpoints(
    ctx.db,
    ctx.workspaceId,
    workflow.id,
    webhookNodes.map((n) => n.id),
  );

  const deployed = await repo.markWorkflowDeployed(
    ctx.db,
    workflow.id,
    ctx.workspaceId,
    version.id,
  );

  return {
    workflowId: workflow.id,
    deployedVersionId: version.id,
    deployedVersionNumber: version.versionNumber,
    deployedAt: deployed?.deployedAt ?? new Date(),
    endpoints,
  };
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
    if (!workflow) {
      return {
        workflow: null,
        version: null,
        originChatId: null,
        deployment: null,
      };
    }
    const [version, originChatId, deployedVersion] = await Promise.all([
      repo.getLatestVersion(ctx.db, workflow.id, ctx.workspaceId),
      repo.getOriginChatId(ctx.db, workflow.id, ctx.workspaceId),
      workflow.deployedVersionId
        ? repo.getVersionById(
            ctx.db,
            workflow.deployedVersionId,
            ctx.workspaceId,
          )
        : Promise.resolve(null),
    ]);
    const deployment = deployedVersion
      ? {
          versionId: deployedVersion.id,
          versionNumber: deployedVersion.versionNumber,
          deployedAt: workflow.deployedAt,
          hasUndeployedChanges:
            version !== null && version.id !== deployedVersion.id,
        }
      : null;
    return { workflow, version, originChatId, deployment };
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

  // Deploys the latest saved version.
  async activate(ctx: WorkspaceCtx, input: { workflowId: string }) {
    const [workflow, version] = await Promise.all([
      repo.getWorkflowForWorkspace(ctx.db, input.workflowId, ctx.workspaceId),
      repo.getLatestVersion(ctx.db, input.workflowId, ctx.workspaceId),
    ]);
    if (!workflow) throw appError(ErrCode.NotFound, "Workflow not found");
    if (!version)
      throw appError(ErrCode.BadInput, "Save the workflow before activating");
    return deploy(ctx, workflow, version);
  },

  // Deploys a specific saved version: rollback, or redeploying an older
  // snapshot without touching the editor's latest version.
  async deployVersion(
    ctx: WorkspaceCtx,
    input: { workflowId: string; versionNumber: number },
  ) {
    const [workflow, version] = await Promise.all([
      repo.getWorkflowForWorkspace(ctx.db, input.workflowId, ctx.workspaceId),
      repo.getVersionByNumber(
        ctx.db,
        input.workflowId,
        ctx.workspaceId,
        input.versionNumber,
      ),
    ]);
    if (!workflow) throw appError(ErrCode.NotFound, "Workflow not found");
    if (!version) throw appError(ErrCode.NotFound, "Version not found");
    return deploy(ctx, workflow, version);
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

  // Re-register all triggers for the deployed version. deploy() is idempotent
  // (upserts endpoints, disables stale ones), so no deactivate step is needed
  // and a failed validation leaves the workflow running as before.
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

    const version = workflow.deployedVersionId
      ? await repo.getVersionById(
          ctx.db,
          workflow.deployedVersionId,
          ctx.workspaceId,
        )
      : null;
    if (version) return deploy(ctx, workflow, version);
    return workflowsService.activate(ctx, input);
  },
};
