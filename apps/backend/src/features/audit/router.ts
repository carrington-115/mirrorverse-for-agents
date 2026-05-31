import { router } from "../../trpc/init.js";
import { workspaceProc } from "../../trpc/middleware.js";

import { auditService } from "./service.js";
import { listAuditInput } from "./inputs.js";

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
