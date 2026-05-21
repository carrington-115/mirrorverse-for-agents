import { eq, getDb, schema } from "@mirrorverse/db";
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

  const db = getDb();
  const connectionRequest = await findPendingConnectionRequest(db, requestId);

  if (!connectionRequest) return jsonError(404, "Connection request not found");
  if (connectionRequest.status !== "pending") {
    return redirectToApp(connectionRequest.workspaceId, "already_resolved");
  }
  if (new Date() > connectionRequest.expiresAt) {
    await db
      .update(schema.connectionRequests)
      .set({ status: "expired" })
      .where(eq(schema.connectionRequests.id, requestId));
    return redirectToApp(connectionRequest.workspaceId, "expired");
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
    return redirectToApp(connectionRequest.workspaceId, "pending");
  }

  // Write the connection row
  const [connection] = await db
    .insert(schema.connections)
    .values({
      workspaceId: connectionRequest.workspaceId,
      mcpServerId: connectionRequest.mcpServerId,
      appSlug: connectionRequest.appSlug,
      displayName: connectionRequest.appSlug,
      status: "active",
      credentialKind: "oauth2",
      externalAccountId: account.id,
      createdBy: connectionRequest.workspaceId,
    })
    .onConflictDoNothing()
    .returning();

  if (connection) {
    await resolveConnectionRequest(db, requestId, connection.id);

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
