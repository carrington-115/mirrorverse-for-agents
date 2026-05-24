import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { slugify } from "../../lib/slug";

import * as repo from "./repo";
import type { CreateMcpServerInput } from "./inputs";

interface WorkspaceCtx {
  readonly db: Database;
  readonly userId: UserId;
  readonly workspaceId: string;
}

export const toolsService = {
  async createMcpServer(ctx: WorkspaceCtx, input: CreateMcpServerInput) {
    const slug = slugify(input.name) || `mcp-${Date.now()}`;
    return repo.createMcpServer(ctx.db, {
      workspaceId: ctx.workspaceId,
      addedBy: ctx.userId,
      name: input.name,
      slug,
      url: input.url,
    });
  },

  // workspaceProc has already resolved the workspace and opened the tenant
  // transaction, so use ctx.workspaceId directly instead of re-resolving.
  async listConnections(ctx: WorkspaceCtx) {
    return repo.listWorkspaceConnections(ctx.db, ctx.workspaceId);
  },

  async revokeConnection(ctx: WorkspaceCtx, connectionId: string) {
    return repo.revokeConnection(ctx.db, connectionId, ctx.workspaceId);
  },
};
