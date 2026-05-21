import { randomUUID } from "node:crypto";
import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";
import { env } from "@mirrorverse/env/backend";
import { schema } from "@mirrorverse/db";

import { appError, ErrCode } from "../../lib/errors";
import { getChatForUser } from "../chats/repo";
import {
  getComposioAuthRedirectUrl,
  getComposioInstance,
  getToolkitMetadata,
  lookupComposioMcpServerId,
} from "../../mcp/composio/client";
import { createConnectionRequest } from "../../mcp/composio/auth";

import type { ToolkitInfoInput, InitiateAppConnectionInput } from "./inputs";

interface WorkspaceCtx {
  readonly db: Database;
  readonly userId: UserId;
  readonly workspaceId: string;
}

interface BaseCtx {
  readonly db: Database;
  readonly userId: UserId;
}

export const connectionsService = {
  async toolkitInfo(_ctx: BaseCtx, input: ToolkitInfoInput) {
    return getToolkitMetadata(input.slugs);
  },

  async initiateAppConnection(
    ctx: WorkspaceCtx,
    input: InitiateAppConnectionInput,
  ) {
    if (input.chatId) {
      const chat = await getChatForUser(ctx.db, input.chatId, ctx.userId);
      if (!chat) throw appError(ErrCode.NotFound, "Chat not found");
    }

    const mcpServerId = await lookupComposioMcpServerId(ctx.db);
    if (!mcpServerId)
      throw appError(ErrCode.Internal, "Composio MCP server not configured");

    // If Composio already has an active account for this workspace + toolkit, sync it to the
    // local DB and skip the OAuth flow entirely — no redirect needed.
    const composio = getComposioInstance();
    const existing = await composio.connectedAccounts.list({
      userId: ctx.workspaceId,
    } as Parameters<typeof composio.connectedAccounts.list>[0]);
    const existingAccount = (
      existing as {
        items?: Array<{
          id: string;
          toolkit?: { slug?: string };
          status?: string;
        }>;
      }
    ).items?.find(
      (a) =>
        (a.toolkit?.slug ?? "").toLowerCase() === input.appSlug.toLowerCase() &&
        a.status === "ACTIVE",
    );

    if (existingAccount) {
      await ctx.db
        .insert(schema.connections)
        .values({
          workspaceId: ctx.workspaceId,
          mcpServerId,
          appSlug: input.appSlug,
          displayName: input.appSlug,
          status: "active",
          credentialKind: "oauth2",
          externalAccountId: existingAccount.id,
          createdBy: ctx.workspaceId,
        })
        .onConflictDoNothing();
      return { redirectUrl: null, connectionRequestId: null };
    }

    // Pre-generate so we can embed the id in the Composio callback URL before it is persisted.
    const connectionRequestId = randomUUID();
    const callbackBase =
      env.COMPOSIO_OAUTH_CALLBACK_URL ??
      `http://localhost:${env.PORT}/api/connections/callback`;
    const callbackUrl = `${callbackBase}?requestId=${connectionRequestId}`;

    const redirectUrl = await getComposioAuthRedirectUrl(
      ctx.workspaceId,
      input.appSlug,
      callbackUrl,
    );
    if (!redirectUrl)
      throw appError(ErrCode.Internal, "Could not initiate connection");

    const connectionReq = await createConnectionRequest(ctx.db, {
      id: connectionRequestId,
      workspaceId: ctx.workspaceId,
      chatId: input.chatId,
      mcpServerId,
      appSlug: input.appSlug,
      redirectUrl,
    });

    return {
      redirectUrl,
      connectionRequestId: connectionReq.id,
    };
  },
};
