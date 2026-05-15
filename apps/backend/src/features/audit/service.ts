import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { appError, ErrCode } from "../../lib/errors";

import * as repo from "./repo";
import type { ListAuditInput } from "./inputs";

interface BaseCtx {
  readonly db: Database;
  readonly userId: UserId;
}

export const auditService = {
  async list(ctx: BaseCtx, input: ListAuditInput) {
    const isAdmin = await repo.isWorkspaceAdminOrOwner(
      ctx.db,
      input.workspaceId,
      ctx.userId,
    );
    if (!isAdmin) {
      throw appError(ErrCode.Forbidden, "Admin access required");
    }
    return repo.listAuditLog(ctx.db, input);
  },
};
