import { z } from "zod";

import { inngest } from "../inngest/client";
import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";
import { humanReviewRespondedEvent } from "../inngest/events";

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
});
