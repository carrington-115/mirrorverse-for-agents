import { createHash, randomUUID } from "node:crypto";

import { and, eq, schema } from "@mirrorverse/db";
import type { WorkflowDocument } from "@mirrorverse/types";
import { Cron } from "croner";
import { z } from "zod";

import type { FirstPartyServer } from "../server-host";

const { workflows, workflowVersions } = schema;

export const scheduleServer: FirstPartyServer = {
  id: "first_party.schedule",
  tools: {
    create_cron: {
      description:
        "Attach a cron schedule to an existing workflow. Updates the trigger.cron node's " +
        "expression and timezone, saves a new version, and activates the workflow.",
      inputSchema: z.object({
        workflowId: z.string().min(1),
        expression: z
          .string()
          .min(1)
          .describe("Standard 5-field cron expression, e.g. '0 9 * * 1'"),
        timezone: z
          .string()
          .default("UTC")
          .describe("IANA timezone, e.g. 'America/New_York'"),
      }),
      async handler(
        {
          workflowId,
          expression,
          timezone,
        }: { workflowId: string; expression: string; timezone: string },
        ctx,
      ) {
        // Validate expression early — croner throws on invalid syntax.
        try {
          new Cron(expression, { timezone });
        } catch {
          throw new Error(
            `first_party.schedule: invalid cron expression "${expression}" or timezone "${timezone}"`,
          );
        }

        const [version] = await ctx.db
          .select({
            id: workflowVersions.id,
            versionNumber: workflowVersions.versionNumber,
            document: workflowVersions.document,
          })
          .from(workflowVersions)
          .where(
            and(
              eq(workflowVersions.workflowId, workflowId),
              eq(workflowVersions.workspaceId, ctx.workspaceId),
            ),
          )
          .orderBy(workflowVersions.versionNumber)
          .limit(1);

        if (!version)
          throw new Error(
            `first_party.schedule: workflow "${workflowId}" not found`,
          );

        const doc = version.document as WorkflowDocument;
        const updatedNodes = doc.nodes.map((n) => {
          if (n.type !== "trigger.cron") return n;
          return { ...n, params: { ...n.params, expression, timezone } };
        });

        if (!updatedNodes.some((n) => n.type === "trigger.cron")) {
          throw new Error(
            `first_party.schedule: workflow "${workflowId}" has no trigger.cron node`,
          );
        }

        const updatedDoc = { ...doc, nodes: updatedNodes };
        const newVersionId = randomUUID();
        const nextVersion = version.versionNumber + 1;
        const checksum = createHash("sha256")
          .update(JSON.stringify(updatedDoc))
          .digest("hex");

        await ctx.db.transaction(async (tx) => {
          await tx.insert(workflowVersions).values({
            id: newVersionId,
            workspaceId: ctx.workspaceId,
            workflowId,
            versionNumber: nextVersion,
            document: updatedDoc as never,
            compiledAgent: null,
            createdBy: ctx.userId || "system",
            generatedByChatId: null,
            summary: `Set cron schedule: ${expression} (${timezone})`,
            checksum,
          });
          await tx
            .update(workflows)
            .set({ currentVersionId: newVersionId, status: "active" })
            .where(
              and(
                eq(workflows.id, workflowId),
                eq(workflows.workspaceId, ctx.workspaceId),
              ),
            );
        });

        return {
          ok: true,
          versionId: newVersionId,
          versionNumber: nextVersion,
        };
      },
    },

    cancel_cron: {
      description: "Pause a workflow, stopping its cron from firing.",
      inputSchema: z.object({
        workflowId: z.string().min(1),
      }),
      async handler({ workflowId }: { workflowId: string }, ctx) {
        const [row] = await ctx.db
          .update(workflows)
          .set({ status: "paused" })
          .where(
            and(
              eq(workflows.id, workflowId),
              eq(workflows.workspaceId, ctx.workspaceId),
            ),
          )
          .returning({ id: workflows.id });

        return { ok: Boolean(row), workflowId };
      },
    },
  },
};
