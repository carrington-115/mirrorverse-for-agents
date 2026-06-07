import { createHash, randomUUID } from "node:crypto";

import { and, desc, eq, schema } from "@mirrorverse/db";
import type { WorkflowDocument } from "@mirrorverse/types";
import { z } from "zod";

import type { FirstPartyServer } from "../server-host";

const { workflows, workflowVersions } = schema;

async function loadAndSave(
  ctx: {
    db: Parameters<FirstPartyServer["tools"][string]["handler"]>[1]["db"];
    workspaceId: string;
    userId: string;
  },
  workflowId: string,
  mutate: (doc: WorkflowDocument) => WorkflowDocument,
  summary: string,
) {
  const [current] = await ctx.db
    .select({
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
    .orderBy(desc(workflowVersions.versionNumber))
    .limit(1);

  if (!current) throw new Error(`canvas: workflow "${workflowId}" not found`);

  const updatedDoc = mutate(current.document as WorkflowDocument);
  const newVersionId = randomUUID();
  const nextVersion = current.versionNumber + 1;
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
      summary,
      checksum,
    });
    await tx
      .update(workflows)
      .set({ currentVersionId: newVersionId })
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.workspaceId, ctx.workspaceId),
        ),
      );
  });

  return {
    document: updatedDoc,
    versionId: newVersionId,
    versionNumber: nextVersion,
  };
}

export const canvasServer: FirstPartyServer = {
  id: "first_party.canvas",
  tools: {
    add_node: {
      description:
        "Add a new node to a workflow document. Returns the updated document.",
      inputSchema: z.object({
        workflowId: z.string().min(1),
        nodeType: z
          .string()
          .min(1)
          .describe("Node type, e.g. 'core.http_request'"),
        params: z.record(z.string(), z.unknown()).default({}),
        position: z
          .object({ x: z.number(), y: z.number() })
          .default({ x: 0, y: 0 }),
      }),
      async handler(
        {
          workflowId,
          nodeType,
          params,
          position,
        }: {
          workflowId: string;
          nodeType: string;
          params: Record<string, unknown>;
          position: { x: number; y: number };
        },
        ctx,
      ) {
        const newNodeId = randomUUID();
        return loadAndSave(
          ctx,
          workflowId,
          (doc) => ({
            ...doc,
            nodes: [
              ...doc.nodes,
              { id: newNodeId, type: nodeType, position, params },
            ],
          }),
          `Add node ${nodeType}`,
        );
      },
    },

    connect_nodes: {
      description:
        "Connect two nodes in a workflow document. Returns the updated document.",
      inputSchema: z.object({
        workflowId: z.string().min(1),
        fromNodeId: z.string().min(1),
        fromPort: z.string().min(1).default("main"),
        toNodeId: z.string().min(1),
        toPort: z.string().min(1).default("main"),
      }),
      async handler(
        {
          workflowId,
          fromNodeId,
          fromPort,
          toNodeId,
          toPort,
        }: {
          workflowId: string;
          fromNodeId: string;
          fromPort: string;
          toNodeId: string;
          toPort: string;
        },
        ctx,
      ) {
        return loadAndSave(
          ctx,
          workflowId,
          (doc) => ({
            ...doc,
            connections: [
              ...doc.connections,
              { from: fromNodeId, fromPort, to: toNodeId, toPort },
            ],
          }),
          `Connect ${fromNodeId}:${fromPort} → ${toNodeId}:${toPort}`,
        );
      },
    },

    set_param: {
      description:
        "Set a single parameter on a node in a workflow document. Returns the updated document.",
      inputSchema: z.object({
        workflowId: z.string().min(1),
        nodeId: z.string().min(1),
        paramKey: z.string().min(1),
        paramValue: z.unknown(),
      }),
      async handler(
        {
          workflowId,
          nodeId,
          paramKey,
          paramValue,
        }: {
          workflowId: string;
          nodeId: string;
          paramKey: string;
          paramValue: unknown;
        },
        ctx,
      ) {
        return loadAndSave(
          ctx,
          workflowId,
          (doc) => {
            const nodes = doc.nodes.map((n) => {
              if (n.id !== nodeId) return n;
              return { ...n, params: { ...n.params, [paramKey]: paramValue } };
            });
            return { ...doc, nodes };
          },
          `Set ${nodeId}.${paramKey}`,
        );
      },
    },
  },
};
