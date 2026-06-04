import { z } from "zod";

import { and, asc, desc, eq, gte, lt, schema, sql } from "@mirrorverse/db";
import type { JsonValue, RunStatus } from "@mirrorverse/types";

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
    .mutation(async ({ input }) => {
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
        status: z.string().optional(),
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
        conditions.push(
          eq(schema.workflowRuns.status, input.status as RunStatus),
        );
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

      return Array.from(map.values());
    }),

  retry: workspaceProc
    .input(
      z.object({
        runId: z.string().min(1),
        fromStepId: z.string().optional(),
      }),
    )
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

      await inngest.send(
        workflowExecuteEvent.create({
          workspaceId: run.workspaceId,
          workflowId: run.workflowId,
          workflowVersionId: run.workflowVersionId,
          triggerNodeId: run.triggerNodeId,
          triggerKind: run.triggerKind,
          triggerPayload: run.triggerPayload as JsonValue,
          initiatedBy: `retry:${run.id}${input.fromStepId ? `:from:${input.fromStepId}` : ""}`,
        }),
      );

      return { ok: true as const };
    }),
});
