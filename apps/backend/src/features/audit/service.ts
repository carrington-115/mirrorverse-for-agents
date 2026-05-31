import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { appError, ErrCode } from "../../lib/errors.js";

import * as repo from "./repo.js";
import type { ListAuditInput } from "./inputs.js";

interface WorkspaceCtx {
  readonly db: Database;
  readonly userId: UserId;
  readonly workspaceId: string;
}

export const auditService = {
  async list(ctx: WorkspaceCtx, input: ListAuditInput) {
    const isAdmin = await repo.isWorkspaceAdminOrOwner(
      ctx.db,
      ctx.workspaceId,
      ctx.userId,
    );
    if (!isAdmin) {
      throw appError(ErrCode.Forbidden, "Admin access required");
    }
    // Scope to the resolved workspace, ignoring any client-supplied id.
    return repo.listAuditLog(ctx.db, {
      ...input,
      workspaceId: ctx.workspaceId,
    });
  },
};
