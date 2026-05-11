import { router } from "../../trpc/init";
import { protectedProc } from "../../trpc/middleware";

import { createMcpServerInput } from "./inputs";
import { toolsService } from "./service";

export const toolsRouter = router({
  createMcpServer: protectedProc
    .input(createMcpServerInput)
    .mutation(({ ctx, input }) =>
      toolsService.createMcpServer({ db: ctx.db, userId: ctx.user.id }, input),
    ),
});
