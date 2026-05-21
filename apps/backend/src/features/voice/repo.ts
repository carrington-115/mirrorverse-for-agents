import { and, desc, eq } from "@mirrorverse/db";
import type { Database } from "@mirrorverse/db";
import { schema } from "@mirrorverse/db";

const { voiceAgents, phoneNumbers, voiceCalls } = schema;

// ── Voice agents ──────────────────────────────────────────────────────────────

export async function getVoiceAgentByWorkflow(
  db: Database,
  workspaceId: string,
  workflowId: string,
) {
  const [row] = await db
    .select()
    .from(voiceAgents)
    .where(
      and(
        eq(voiceAgents.workspaceId, workspaceId),
        eq(voiceAgents.workflowId, workflowId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getVoiceAgentByExternalAssistantId(
  db: Database,
  externalAssistantId: string,
) {
  const [row] = await db
    .select()
    .from(voiceAgents)
    .where(eq(voiceAgents.externalAssistantId, externalAssistantId))
    .limit(1);
  return row ?? null;
}

export async function listVoiceAgents(db: Database, workspaceId: string) {
  return db
    .select()
    .from(voiceAgents)
    .where(eq(voiceAgents.workspaceId, workspaceId))
    .orderBy(desc(voiceAgents.createdAt));
}

export async function insertVoiceAgent(
  db: Database,
  values: typeof voiceAgents.$inferInsert,
) {
  const [row] = await db.insert(voiceAgents).values(values).returning();
  return row!;
}

export async function updateVoiceAgent(
  db: Database,
  id: string,
  values: Partial<typeof voiceAgents.$inferInsert>,
) {
  const [row] = await db
    .update(voiceAgents)
    .set(values)
    .where(eq(voiceAgents.id, id))
    .returning();
  return row ?? null;
}

// ── Phone numbers ─────────────────────────────────────────────────────────────

export async function getPhoneNumber(
  db: Database,
  workspaceId: string,
  id: string,
) {
  const [row] = await db
    .select()
    .from(phoneNumbers)
    .where(
      and(eq(phoneNumbers.workspaceId, workspaceId), eq(phoneNumbers.id, id)),
    )
    .limit(1);
  return row ?? null;
}

export async function listPhoneNumbers(db: Database, workspaceId: string) {
  return db
    .select()
    .from(phoneNumbers)
    .where(eq(phoneNumbers.workspaceId, workspaceId))
    .orderBy(desc(phoneNumbers.createdAt));
}

export async function insertPhoneNumber(
  db: Database,
  values: typeof phoneNumbers.$inferInsert,
) {
  const [row] = await db.insert(phoneNumbers).values(values).returning();
  return row!;
}

export async function updatePhoneNumber(
  db: Database,
  id: string,
  values: Partial<typeof phoneNumbers.$inferInsert>,
) {
  const [row] = await db
    .update(phoneNumbers)
    .set(values)
    .where(eq(phoneNumbers.id, id))
    .returning();
  return row ?? null;
}

// ── Voice calls ───────────────────────────────────────────────────────────────

export async function listVoiceCalls(
  db: Database,
  workspaceId: string,
  voiceAgentId: string,
  limit: number,
) {
  return db
    .select()
    .from(voiceCalls)
    .where(
      and(
        eq(voiceCalls.workspaceId, workspaceId),
        eq(voiceCalls.voiceAgentId, voiceAgentId),
      ),
    )
    .orderBy(desc(voiceCalls.startedAt))
    .limit(limit);
}

export async function listVoiceCallsByPhone(
  db: Database,
  workspaceId: string,
  phoneNumberId: string,
  limit: number,
) {
  return db
    .select()
    .from(voiceCalls)
    .where(
      and(
        eq(voiceCalls.workspaceId, workspaceId),
        eq(voiceCalls.phoneNumberId, phoneNumberId),
      ),
    )
    .orderBy(desc(voiceCalls.startedAt))
    .limit(limit);
}

export async function insertVoiceCall(
  db: Database,
  values: typeof voiceCalls.$inferInsert,
) {
  const [row] = await db.insert(voiceCalls).values(values).returning();
  return row!;
}

export async function updateVoiceCall(
  db: Database,
  externalCallId: string,
  values: Partial<typeof voiceCalls.$inferInsert>,
) {
  const [row] = await db
    .update(voiceCalls)
    .set(values)
    .where(eq(voiceCalls.externalCallId, externalCallId))
    .returning();
  return row ?? null;
}
