import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";

import { createMcpServerInput, revokeConnectionInput } from "./inputs";
import { toolsService } from "./service";

export const toolsRouter = router({
  createMcpServer: workspaceProc
    .input(createMcpServerInput)
    .mutation(({ ctx, input }) =>
      toolsService.createMcpServer(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  // workspaceProc so the query runs inside the tenant transaction (RLS-scoped).
  listConnections: workspaceProc.query(({ ctx }) =>
    toolsService.listConnections({
      db: ctx.db,
      userId: ctx.user.id,
      workspaceId: ctx.workspaceId,
    }),
  ),

  revokeConnection: workspaceProc
    .input(revokeConnectionInput)
    .mutation(({ ctx, input }) =>
      toolsService.revokeConnection(
        { db: ctx.db, userId: ctx.user.id, workspaceId: ctx.workspaceId },
        input.connectionId,
      ),
    ),
});
