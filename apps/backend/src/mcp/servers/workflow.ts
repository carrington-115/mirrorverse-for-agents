import { createHash, randomUUID } from "node:crypto";

import { and, desc, eq, schema, type Database } from "@mirrorverse/db";
import {
  workflowDocumentSchema,
  type WorkflowDocumentInput,
} from "@mirrorverse/agent/schemas";
import { z } from "zod";

import {
  countWorkflows,
  getActiveSubscription,
} from "../../features/billing/repo";
import type { FirstPartyServer } from "../server-host";

const { workflows, workflowVersions } = schema;

function checksumDoc(doc: WorkflowDocumentInput): string {
  return createHash("sha256").update(JSON.stringify(doc)).digest("hex");
}

async function getLatest(
  db: Database,
  workflowId: string,
  workspaceId: string,
) {
  const [row] = await db
    .select()
    .from(workflowVersions)
    .where(
      and(
        eq(workflowVersions.workflowId, workflowId),
        eq(workflowVersions.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(workflowVersions.versionNumber))
    .limit(1);
  return row ?? null;
}

export const workflowServer: FirstPartyServer = {
  id: "first_party.workflow",
  tools: {
    commit: {
      description:
        "Create or update a workflow. Pass the full WorkflowDocument JSON. " +
        "If workflowId is provided, adds a new version to the existing workflow; " +
        "otherwise creates a new one.",
      inputSchema: z.object({
        document: workflowDocumentSchema.describe("The full workflow document"),
        workflowId: z
          .string()
          .optional()
          .describe(
            "Existing workflow ID to update. Omit to create a new workflow.",
          ),
        summary: z.string().default("Updated via first-party MCP"),
      }),
      async handler(
        {
          document,
          workflowId,
          summary,
        }: {
          document: WorkflowDocumentInput;
          workflowId?: string;
          summary: string;
        },
        ctx,
      ) {
        const versionId = randomUUID();

        if (workflowId) {
          const latest = await getLatest(ctx.db, workflowId, ctx.workspaceId);
          const nextVersion = (latest?.versionNumber ?? 0) + 1;
          const doc: WorkflowDocumentInput = {
            ...document,
            id: workflowId,
            version: nextVersion,
          };

          await ctx.db.transaction(async (tx) => {
            await tx.insert(workflowVersions).values({
              id: versionId,
              workspaceId: ctx.workspaceId,
              workflowId,
              versionNumber: nextVersion,
              document: doc as never,
              compiledAgent: null,
              createdBy: ctx.userId || "system",
              generatedByChatId: null,
              summary,
              checksum: checksumDoc(doc),
            });
            await tx
              .update(workflows)
              .set({ currentVersionId: versionId, name: document.name })
              .where(
                and(
                  eq(workflows.id, workflowId),
                  eq(workflows.workspaceId, ctx.workspaceId),
                ),
              );
          });

          return { workflowId, versionId, versionNumber: nextVersion };
        }

        const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
        const workflowLimit = sub?.plan.limits.maxWorkflows ?? null;
        if (workflowLimit !== null) {
          const used = await countWorkflows(ctx.db, ctx.workspaceId);
          if (used >= workflowLimit) {
            throw new Error(
              "Workflow limit reached for your plan. Please upgrade to create more workflows.",
            );
          }
        }

        const newWorkflowId = randomUUID();
        const doc: WorkflowDocumentInput = {
          ...document,
          id: newWorkflowId,
          version: 1,
        };

        await ctx.db.transaction(async (tx) => {
          await tx.insert(workflows).values({
            id: newWorkflowId,
            workspaceId: ctx.workspaceId,
            name: document.name,
            description: null,
            kind: "automation",
            status: "draft",
            currentVersionId: versionId,
            createdBy: ctx.userId || "system",
            tags: [],
          });
          await tx.insert(workflowVersions).values({
            id: versionId,
            workspaceId: ctx.workspaceId,
            workflowId: newWorkflowId,
            versionNumber: 1,
            document: doc as never,
            compiledAgent: null,
            createdBy: ctx.userId || "system",
            generatedByChatId: null,
            summary,
            checksum: checksumDoc(doc),
          });
        });

        return { workflowId: newWorkflowId, versionId, versionNumber: 1 };
      },
    },

    list: {
      description: "List all workflows in the workspace.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(50),
      }),
      async handler({ limit }: { limit: number }, ctx) {
        const rows = await ctx.db
          .select({
            id: workflows.id,
            name: workflows.name,
            kind: workflows.kind,
            status: workflows.status,
            updatedAt: workflows.updatedAt,
          })
          .from(workflows)
          .where(eq(workflows.workspaceId, ctx.workspaceId))
          .orderBy(desc(workflows.updatedAt))
          .limit(limit);
        return { workflows: rows };
      },
    },

    get: {
      description: "Get a workflow and its latest document by ID.",
      inputSchema: z.object({
        workflowId: z.string().min(1),
      }),
      async handler({ workflowId }: { workflowId: string }, ctx) {
        const [workflow] = await ctx.db
          .select()
          .from(workflows)
          .where(
            and(
              eq(workflows.id, workflowId),
              eq(workflows.workspaceId, ctx.workspaceId),
            ),
          )
          .limit(1);
        if (!workflow) return { workflow: null, document: null };

        const version = await getLatest(ctx.db, workflowId, ctx.workspaceId);
        return { workflow, document: version?.document ?? null };
      },
    },

    archive: {
      description: "Permanently delete a workflow and all its versions.",
      inputSchema: z.object({
        workflowId: z.string().min(1),
      }),
      async handler({ workflowId }: { workflowId: string }, ctx) {
        const result = await ctx.db
          .delete(workflows)
          .where(
            and(
              eq(workflows.id, workflowId),
              eq(workflows.workspaceId, ctx.workspaceId),
            ),
          )
          .returning({ id: workflows.id });
        return { ok: result.length > 0, workflowId };
      },
    },
  },
};
