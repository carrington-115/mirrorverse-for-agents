import { router } from "../../trpc/init";
import { protectedProc } from "../../trpc/middleware";

import { auditService } from "./service";
import { listAuditInput } from "./inputs";

export const auditRouter = router({
  list: protectedProc
    .input(listAuditInput)
    .query(({ ctx, input }) =>
      auditService.list({ db: ctx.db, userId: ctx.user.id }, input),
    ),
});
