import { z } from "zod";

import { inngest } from "../inngest/client";
import { router, TRPCError } from "../../trpc/init";
import { publicProc, workspaceProc } from "../../trpc/middleware";
import { humanReviewRespondedEvent } from "../inngest/events";
import { eq, schema } from "@mirrorverse/db";

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
});
