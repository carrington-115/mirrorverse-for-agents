import { router } from "../../trpc/init";
import { protectedProc } from "../../trpc/middleware";

import { createMcpServerInput, revokeConnectionInput } from "./inputs";
import { toolsService } from "./service";

export const toolsRouter = router({
  createMcpServer: protectedProc
    .input(createMcpServerInput)
    .mutation(({ ctx, input }) =>
      toolsService.createMcpServer({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  listConnections: protectedProc.query(({ ctx }) =>
    toolsService.listConnections({ db: ctx.db, userId: ctx.user.id }),
  ),

  revokeConnection: protectedProc
    .input(revokeConnectionInput)
    .mutation(({ ctx, input }) =>
      toolsService.revokeConnection(
        { db: ctx.db, userId: ctx.user.id },
        input.connectionId,
      ),
    ),
});
