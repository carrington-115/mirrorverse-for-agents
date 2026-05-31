import { router } from "../../trpc/init.js";
import { protectedProc, workspaceProc } from "../../trpc/middleware.js";

import { initiateAppConnectionInput, toolkitInfoInput } from "./inputs.js";
import { connectionsService } from "./service.js";

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
    .mutation(({ ctx, input }) =>
      connectionsService.initiateAppConnection(
        { db: ctx.db, userId: ctx.user.id, workspaceId: ctx.workspaceId },
        input,
      ),
    ),
});
