import { randomUUID } from "node:crypto";
import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";
import { env } from "@mirrorverse/env/backend";
import { eq, getDb, schema } from "@mirrorverse/db";

import { appError, ErrCode } from "../../lib/errors.js";
import { getChatForUser } from "../chats/repo.js";
import {
  getComposioAuthRedirectUrl,
  getComposioInstance,
  getToolkitMetadata,
  listComposioIntegrations,
  lookupComposioMcpServerId,
} from "../../mcp/composio/client.js";
import { createConnectionRequest } from "../../mcp/composio/auth.js";

import type { ToolkitInfoInput, InitiateAppConnectionInput } from "./inputs.js";

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

  async listAvailableIntegrations(_ctx: BaseCtx) {
    return listComposioIntegrations();
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

    const connectionRequestId = randomUUID();
    const callbackBase =
      env.COMPOSIO_OAUTH_CALLBACK_URL ??
      `http://localhost:${env.PORT}/api/connections/callback`;
    const callbackUrl = `${callbackBase}?requestId=${connectionRequestId}`;

    // Persist the request BEFORE calling Composio. For some apps Composio
    // calls our callbackUrl server-to-server during link() processing; the
    // insert must be committed (not just in an open transaction) by then.
    // getDb() is the privileged connection whose writes commit immediately.
    const connectionReq = await createConnectionRequest(getDb(), {
      id: connectionRequestId,
      workspaceId: ctx.workspaceId,
      chatId: input.chatId,
      mcpServerId,
      appSlug: input.appSlug,
      redirectUrl: callbackUrl,
    });

    let redirectUrl: string;
    try {
      const url = await getComposioAuthRedirectUrl(
        ctx.workspaceId,
        input.appSlug,
        callbackUrl,
      );
      if (!url) throw new Error("no redirectUrl");
      redirectUrl = url;
    } catch {
      await getDb()
        .update(schema.connectionRequests)
        .set({ status: "expired" })
        .where(eq(schema.connectionRequests.id, connectionRequestId));
      throw appError(ErrCode.Internal, "Could not initiate connection");
    }

    return {
      redirectUrl,
      connectionRequestId: connectionReq.id,
    };
  },
};
