import { eq, getDb, schema, withTenantContext } from "@mirrorverse/db";
import { env } from "@mirrorverse/env/backend";
import {
  getComposioInstance,
  isComposioConfigured,
} from "../../src/mcp/composio/client";
import {
  resolveConnectionRequest,
  findPendingConnectionRequest,
} from "../../src/mcp/composio/auth";
import { inngest } from "../../src/features/inngest/client";

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("requestId");

  if (!requestId) return jsonError(400, "Missing requestId");
  if (!isComposioConfigured()) return jsonError(503, "Composio not configured");

  // The pending request is keyed by the random requestId, before any tenant
  // context exists — look it up on the privileged connection (bypasses RLS).
  const connectionRequest = await findPendingConnectionRequest(
    getDb(),
    requestId,
  );

  if (!connectionRequest) return jsonError(404, "Connection request not found");
  if (connectionRequest.status !== "pending") {
    return redirectToApp(connectionRequest.workspaceId, "already_resolved");
  }
  const { workspaceId } = connectionRequest;
  if (new Date() > connectionRequest.expiresAt) {
    await withTenantContext(workspaceId, (db) =>
      db
        .update(schema.connectionRequests)
        .set({ status: "expired" })
        .where(eq(schema.connectionRequests.id, requestId)),
    );
    return redirectToApp(workspaceId, "expired");
  }

  const composio = getComposioInstance();

  // Find the connected account Composio just created for this workspace
  const accounts = await composio.connectedAccounts.list({
    userId: connectionRequest.workspaceId,
  } as Parameters<typeof composio.connectedAccounts.list>[0]);

  const account = (
    accounts as {
      items?: Array<{
        id: string;
        toolkit?: { slug?: string };
        status?: string;
      }>;
    }
  ).items?.find(
    (a) =>
      (a.toolkit?.slug ?? "").toLowerCase() ===
        connectionRequest.appSlug.toLowerCase() && a.status === "ACTIVE",
  );

  if (!account) {
    return redirectToApp(workspaceId, "pending");
  }

  // Persist the connection and resolve the request inside the tenant
  // transaction so RLS scopes the writes to this workspace.
  const connection = await withTenantContext(workspaceId, async (db) => {
    const [row] = await db
      .insert(schema.connections)
      .values({
        workspaceId,
        mcpServerId: connectionRequest.mcpServerId,
        appSlug: connectionRequest.appSlug,
        displayName: connectionRequest.appSlug,
        status: "active",
        credentialKind: "oauth2",
        externalAccountId: account.id,
        createdBy: workspaceId,
      })
      .onConflictDoNothing()
      .returning();
    if (row) await resolveConnectionRequest(db, requestId, row.id);
    return row ?? null;
  });

  if (connection) {
    // Fire Inngest resume event so a future Inngest-based chat can continue
    if (env.INNGEST_EVENT_KEY && connectionRequest.chatId) {
      await inngest.send({
        name: connectionRequest.resumeEventName as "connection.completed",
        data: {
          connectionRequestId: requestId,
          connectionId: connection.id,
          workspaceId: connectionRequest.workspaceId,
          appSlug: connectionRequest.appSlug,
        },
      } as Parameters<typeof inngest.send>[0]);
    }
  }

  return redirectToApp(connectionRequest.workspaceId, "success");
}

function redirectToApp(_workspaceId: string, status: string): Response {
  const appUrl = env.CORS_ORIGIN;
  return Response.redirect(`${appUrl}/integrations?oauth=${status}`, 302);
}
