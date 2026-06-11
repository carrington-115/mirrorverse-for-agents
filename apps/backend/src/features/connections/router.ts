import { router, TRPCError } from "../../trpc/init";
import { protectedProc, workspaceProc } from "../../trpc/middleware";

import { initiateAppConnectionInput, toolkitInfoInput } from "./inputs";
import { connectionsService } from "./service";
import {
  countConnectionsInWorkspace,
  getActiveSubscription,
} from "../billing/repo";

export const connectionsRouter = router({
  toolkitInfo: protectedProc
    .input(toolkitInfoInput)
    .query(({ ctx, input }) =>
      connectionsService.toolkitInfo(
        { db: ctx.db, userId: ctx.user.id },
        input,
      ),
    ),

  listAvailableIntegrations: protectedProc.query(({ ctx }) =>
    connectionsService.listAvailableIntegrations({
      db: ctx.db,
      userId: ctx.user.id,
    }),
  ),

  initiateAppConnection: workspaceProc
    .input(initiateAppConnectionInput)
    .mutation(async ({ ctx, input }) => {
      const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
      const limit = sub?.plan.limits.maxConnections ?? null;
      if (limit !== null) {
        const used = await countConnectionsInWorkspace(ctx.db, ctx.workspaceId);
        if (used >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Integration limit reached. Please upgrade your plan.",
          });
        }
      }
      return connectionsService.initiateAppConnection(
        { db: ctx.db, userId: ctx.user.id, workspaceId: ctx.workspaceId },
        input,
      );
    }),
});
