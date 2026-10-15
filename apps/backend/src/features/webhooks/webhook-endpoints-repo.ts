import { randomBytes } from "node:crypto";

import {
  and,
  eq,
  inArray,
  lt,
  ne,
  notInArray,
  schema,
  sql,
  type Database,
} from "@mirrorverse/db";
import type { JsonValue } from "@mirrorverse/types";

type WebhookInboundStatus = "dispatched" | "duplicate" | "rejected";

const { webhookEndpoints, webhookInboundLog } = schema;

export async function getEndpointBySlug(db: Database, slug: string) {
  const [row] = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function createOrReactivateEndpoint(
  db: Database,
  workspaceId: string,
  workflowId: string,
  triggerNodeId: string,
  slug: string,
  verifySignature: boolean,
) {
  const secret = randomBytes(32).toString("hex");
  const [row] = await db
    .insert(webhookEndpoints)
    .values({
      workspaceId,
      workflowId,
      triggerNodeId,
      slug,
      secret,
      verifySignature,
      enabled: true,
    })
    .onConflictDoUpdate({
      target: [webhookEndpoints.workflowId, webhookEndpoints.triggerNodeId],
      // Keep the existing secret so callers' signing keys survive a redeploy;
      // rotate explicitly via regenerateEndpointSecret.
      set: {
        slug,
        verifySignature,
        enabled: true,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row!;
}

// Slugs (from `slugs`) already claimed by endpoints of a different workflow.
export async function listSlugsTakenByOtherWorkflows(
  db: Database,
  workflowId: string,
  slugs: readonly string[],
): Promise<Set<string>> {
  if (slugs.length === 0) return new Set();
  const rows = await db
    .select({ slug: webhookEndpoints.slug })
    .from(webhookEndpoints)
    .where(
      and(
        inArray(webhookEndpoints.slug, [...slugs]),
        ne(webhookEndpoints.workflowId, workflowId),
      ),
    );
  return new Set(rows.map((r) => r.slug));
}

// Disables endpoints for trigger nodes that no longer exist in the deployed
// version, so removed webhooks stop accepting traffic.
export async function disableStaleEndpoints(
  db: Database,
  workspaceId: string,
  workflowId: string,
  activeTriggerNodeIds: readonly string[],
) {
  await db
    .update(webhookEndpoints)
    .set({ enabled: false, updatedAt: new Date() })
    .where(
      and(
        eq(webhookEndpoints.workflowId, workflowId),
        eq(webhookEndpoints.workspaceId, workspaceId),
        activeTriggerNodeIds.length > 0
          ? notInArray(webhookEndpoints.triggerNodeId, [
              ...activeTriggerNodeIds,
            ])
          : undefined,
      ),
    );
}

export async function pruneInboundLog(db: Database, olderThan: Date) {
  const rows = await db
    .delete(webhookInboundLog)
    .where(lt(webhookInboundLog.receivedAt, olderThan))
    .returning({ id: webhookInboundLog.id });
  return rows.length;
}

export async function disableEndpointsByWorkflowId(
  db: Database,
  workspaceId: string,
  workflowId: string,
) {
  await db
    .update(webhookEndpoints)
    .set({ enabled: false, updatedAt: new Date() })
    .where(
      and(
        eq(webhookEndpoints.workflowId, workflowId),
        eq(webhookEndpoints.workspaceId, workspaceId),
      ),
    );
}

export async function listEndpointsByWorkspace(
  db: Database,
  workspaceId: string,
) {
  return db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.workspaceId, workspaceId));
}

export async function regenerateEndpointSecret(
  db: Database,
  workspaceId: string,
  endpointId: string,
) {
  const newSecret = randomBytes(32).toString("hex");
  const [row] = await db
    .update(webhookEndpoints)
    .set({ secret: newSecret, updatedAt: new Date() })
    .where(
      and(
        eq(webhookEndpoints.id, endpointId),
        eq(webhookEndpoints.workspaceId, workspaceId),
      ),
    )
    .returning();
  return row ?? null;
}

export async function logInbound(
  db: Database,
  endpointId: string,
  slug: string,
  requestId: string | null,
  method: string,
  headers: Record<string, string>,
  body: JsonValue,
  status: WebhookInboundStatus,
): Promise<boolean> {
  try {
    await db.insert(webhookInboundLog).values({
      endpointId,
      slug,
      requestId,
      method,
      headers,
      body,
      status,
    });
    return true;
  } catch (err) {
    // 23505 = unique_violation — duplicate request id
    if (
      err instanceof Error &&
      "code" in err &&
      (err as unknown as { code: string }).code === "23505"
    ) {
      return false;
    }
    throw err;
  }
}

export async function incrementCallCount(db: Database, endpointId: string) {
  await db
    .update(webhookEndpoints)
    .set({
      lastCalledAt: new Date(),
      callsLast24h: sql`${webhookEndpoints.callsLast24h} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(webhookEndpoints.id, endpointId));
}
