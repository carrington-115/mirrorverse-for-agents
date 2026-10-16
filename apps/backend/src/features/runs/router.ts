import { z } from "zod";

import { and, asc, desc, eq, gte, lt, schema, sql } from "@mirrorverse/db";
import type {
  JsonValue,
  RunStatus,
  WorkflowDocument,
} from "@mirrorverse/types";

import { inngest } from "../inngest/client";
import { router, TRPCError } from "../../trpc/init";
import { publicProc, workspaceProc } from "../../trpc/middleware";
import {
  humanReviewRespondedEvent,
  workflowExecuteEvent,
} from "../inngest/events";

export const runsRouter = router({
  resumeHumanReview: workspaceProc
    .input(
      z.object({
        runId: z.string().min(1).max(128),
        nodeId: z.string().min(1).max(128),
        response: z.unknown(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Invalidate the public token so the external link can't be used again.
      await ctx.db
        .update(schema.humanReviewTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(schema.humanReviewTokens.runId, input.runId),
            eq(schema.humanReviewTokens.nodeId, input.nodeId),
            eq(schema.humanReviewTokens.workspaceId, ctx.workspaceId),
          ),
        );

      await inngest.send(
        humanReviewRespondedEvent.create({
          runId: input.runId,
          nodeId: input.nodeId,
          response: input.response,
        }),
      );
      return { ok: true as const };
    }),

  getReviewRequest: publicProc
    .input(z.object({ token: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [row] = await ctx.db
        .select()
        .from(schema.humanReviewTokens)
        .where(eq(schema.humanReviewTokens.token, input.token))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      if (row.expiresAt < new Date())
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "expired",
        });
      if (row.usedAt)
        throw new TRPCError({ code: "CONFLICT", message: "already_used" });
      return {
        promptText: row.promptText ?? "",
        expiresAt: row.expiresAt,
      };
    }),

  submitReviewByToken: publicProc
    .input(z.object({ token: z.string().uuid(), response: z.unknown() }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db
        .select()
        .from(schema.humanReviewTokens)
        .where(eq(schema.humanReviewTokens.token, input.token))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      if (row.expiresAt < new Date())
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "expired",
        });
      if (row.usedAt)
        throw new TRPCError({ code: "CONFLICT", message: "already_used" });

      await ctx.db
        .update(schema.humanReviewTokens)
        .set({ usedAt: new Date() })
        .where(eq(schema.humanReviewTokens.token, input.token));

      await inngest.send(
        humanReviewRespondedEvent.create({
          runId: row.runId,
          nodeId: row.nodeId,
          response: input.response,
        }),
      );
      return { ok: true as const };
    }),

  list: workspaceProc
    .input(
      z.object({
        workflowId: z.string().optional(),
        status: z
          .enum([
            "queued",
            "running",
            "succeeded",
            "failed",
            "cancelled",
            "timed_out",
            "waiting_for_input",
          ])
          .optional(),
        cursor: z.string().datetime({ offset: true }).optional(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(schema.workflowRuns.workspaceId, ctx.workspaceId)];
      if (input.workflowId) {
        conditions.push(eq(schema.workflowRuns.workflowId, input.workflowId));
      }
      if (input.status) {
        conditions.push(eq(schema.workflowRuns.status, input.status));
      }
      if (input.cursor) {
        conditions.push(
          lt(schema.workflowRuns.startedAt, new Date(input.cursor)),
        );
      }

      const rows = await ctx.db
        .select()
        .from(schema.workflowRuns)
        .where(and(...conditions))
        .orderBy(desc(schema.workflowRuns.startedAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;
      const nextCursor = hasMore
        ? items[items.length - 1].startedAt.toISOString()
        : null;

      return { items, nextCursor };
    }),

  get: workspaceProc
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [run] = await ctx.db
        .select()
        .from(schema.workflowRuns)
        .where(
          and(
            eq(schema.workflowRuns.id, input.id),
            eq(schema.workflowRuns.workspaceId, ctx.workspaceId),
          ),
        )
        .limit(1);

      if (!run) throw new TRPCError({ code: "NOT_FOUND" });

      const steps = await ctx.db
        .select()
        .from(schema.workflowRunSteps)
        .where(eq(schema.workflowRunSteps.runId, input.id))
        .orderBy(asc(schema.workflowRunSteps.startedAt));

      return { run, steps };
    }),

  statsByDay: workspaceProc
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const rows = await ctx.db
        .select({
          day: sql<string>`date_trunc('day', ${schema.workflowRuns.startedAt})::text`,
          status: schema.workflowRuns.status,
          total: sql<number>`count(*)::int`,
        })
        .from(schema.workflowRuns)
        .where(
          and(
            eq(schema.workflowRuns.workspaceId, ctx.workspaceId),
            gte(schema.workflowRuns.startedAt, since),
          ),
        )
        .groupBy(
          sql`date_trunc('day', ${schema.workflowRuns.startedAt})`,
          schema.workflowRuns.status,
        )
        .orderBy(sql`date_trunc('day', ${schema.workflowRuns.startedAt})`);

      type DayStat = {
        date: string;
        succeeded: number;
        failed: number;
        running: number;
        cancelled: number;
      };
      const map = new Map<string, DayStat>();

      for (const row of rows) {
        const key = row.day.slice(0, 10);
        if (!map.has(key)) {
          const d = new Date(key + "T00:00:00Z");
          const label = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });
          map.set(key, {
            date: label,
            succeeded: 0,
            failed: 0,
            running: 0,
            cancelled: 0,
          });
        }
        const entry = map.get(key)!;
        const s = row.status;
        if (s === "succeeded") {
          entry.succeeded += row.total;
        } else if (s === "failed" || s === "timed_out") {
          entry.failed += row.total;
        } else if (
          s === "running" ||
          s === "queued" ||
          s === "waiting_for_input"
        ) {
          entry.running += row.total;
        } else if (s === "cancelled") {
          entry.cancelled += row.total;
        }
      }

      // Zero-fill days with no runs so the chart has a continuous X-axis.
      const cursor = new Date(since);
      cursor.setUTCHours(0, 0, 0, 0);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      while (cursor <= today) {
        const key = cursor.toISOString().slice(0, 10);
        if (!map.has(key)) {
          const label = cursor.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });
          map.set(key, {
            date: label,
            succeeded: 0,
            failed: 0,
            running: 0,
            cancelled: 0,
          });
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v);
    }),

  retry: workspaceProc
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [run] = await ctx.db
        .select()
        .from(schema.workflowRuns)
        .where(
          and(
            eq(schema.workflowRuns.id, input.runId),
            eq(schema.workflowRuns.workspaceId, ctx.workspaceId),
          ),
        )
        .limit(1);

      if (!run) throw new TRPCError({ code: "NOT_FOUND" });

      const TERMINAL: RunStatus[] = [
        "failed",
        "timed_out",
        "cancelled",
        "succeeded",
      ];
      if (!TERMINAL.includes(run.status)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Run is not in a terminal state",
        });
      }

      await inngest.send(
        workflowExecuteEvent.create({
          workspaceId: run.workspaceId,
          workflowId: run.workflowId,
          workflowVersionId: run.workflowVersionId,
          triggerNodeId: run.triggerNodeId,
          triggerKind: run.triggerKind,
          triggerPayload: run.triggerPayload as JsonValue,
          initiatedBy: `retry:${run.id}`,
        }),
      );

      return { ok: true as const };
    }),

  triggerManual: workspaceProc
    .input(z.object({ workflowId: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const [workflow] = await ctx.db
        .select({
          deployedVersionId: schema.workflows.deployedVersionId,
          status: schema.workflows.status,
        })
        .from(schema.workflows)
        .where(
          and(
            eq(schema.workflows.id, input.workflowId),
            eq(schema.workflows.workspaceId, ctx.workspaceId),
          ),
        )
        .limit(1);

      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });
      if (workflow.status !== "active") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Workflow is not active",
        });
      }
      if (!workflow.deployedVersionId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Workflow has no deployed version",
        });
      }

      const [version] = await ctx.db
        .select({ document: schema.workflowVersions.document })
        .from(schema.workflowVersions)
        .where(eq(schema.workflowVersions.id, workflow.deployedVersionId))
        .limit(1);

      if (!version) throw new TRPCError({ code: "NOT_FOUND" });

      const doc = version.document as WorkflowDocument;
      const triggerNode = doc.nodes.find((n) => n.type === "trigger.manual");
      if (!triggerNode) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Workflow has no manual trigger node",
        });
      }

      await inngest.send(
        workflowExecuteEvent.create({
          workspaceId: ctx.workspaceId,
          workflowId: input.workflowId,
          workflowVersionId: workflow.deployedVersionId,
          triggerNodeId: triggerNode.id,
          triggerKind: "trigger.manual",
          triggerPayload: {},
          initiatedBy: `manual:${ctx.user.id}`,
        }),
      );

      return { ok: true as const };
    }),

  cancel: workspaceProc
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [run] = await ctx.db
        .select()
        .from(schema.workflowRuns)
        .where(
          and(
            eq(schema.workflowRuns.id, input.runId),
            eq(schema.workflowRuns.workspaceId, ctx.workspaceId),
          ),
        )
        .limit(1);

      if (!run) throw new TRPCError({ code: "NOT_FOUND" });

      const CANCELLABLE: RunStatus[] = [
        "running",
        "queued",
        "waiting_for_input",
      ];
      if (!CANCELLABLE.includes(run.status)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Run cannot be cancelled in its current state",
        });
      }

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - run.startedAt.getTime();

      await ctx.db
        .update(schema.workflowRuns)
        .set({ status: "cancelled", finishedAt, durationMs })
        .where(eq(schema.workflowRuns.id, run.id));

      return { ok: true as const };
    }),
});
