import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";

import { auditService } from "./service";
import { listAuditInput } from "./inputs";

export const auditRouter = router({
  list: workspaceProc
    .input(listAuditInput)
    .query(({ ctx, input }) =>
      auditService.list(
        { db: ctx.db, userId: ctx.user.id, workspaceId: ctx.workspaceId },
        input,
      ),
    ),
});
