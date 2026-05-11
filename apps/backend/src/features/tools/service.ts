import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { slugify } from "../../lib/slug";
import { ensureUserWorkspace } from "../tenancy/repo";

import * as repo from "./repo";
import type { CreateMcpServerInput } from "./inputs";

interface BaseCtx {
  readonly db: Database;
  readonly userId: UserId;
}

export const toolsService = {
  async createMcpServer(ctx: BaseCtx, input: CreateMcpServerInput) {
    const workspaceId = await ensureUserWorkspace(ctx.db, ctx.userId);
    const slug = slugify(input.name) || `mcp-${Date.now()}`;
    return repo.createMcpServer(ctx.db, {
      workspaceId,
      addedBy: ctx.userId,
      name: input.name,
      slug,
      url: input.url,
    });
  },
};
