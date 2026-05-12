import { eq, schema, sql, type Database } from "@mirrorverse/db";
import type { AgentUsageEntry, StepUsageBreakdown } from "@mirrorverse/agent";

const { usageEvents } = schema;

export async function getChatTotalCostCents(
  db: Database,
  chatId: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int`,
    })
    .from(usageEvents)
    .where(eq(usageEvents.chatId, chatId));
  return row?.total ?? 0;
}

export interface RecordChatUsageInput {
  readonly db: Database;
  readonly workspaceId: string;
  readonly chatId: string;
  readonly idempotencyKey: string;
  readonly model: string;
  readonly breakdown: StepUsageBreakdown;
}

function rowsFromBreakdown(input: RecordChatUsageInput): InsertRow[] {
  return input.breakdown.entries.map((entry, index) => ({
    workspaceId: input.workspaceId,
    chatId: input.chatId,
    kind: entry.kind,
    quantity: entry.quantity,
    unit: entry.unit,
    model: entry.model,
    costCents: entry.costCents,
    idempotencyKey: `${input.idempotencyKey}:${entry.kind}:${index}`,
  }));
}

type InsertRow = {
  workspaceId: string;
  chatId: string;
  kind: AgentUsageEntry["kind"];
  quantity: number;
  unit: string;
  model: string;
  costCents: number;
  idempotencyKey: string;
};

export async function recordChatUsage(
  input: RecordChatUsageInput,
): Promise<void> {
  const rows = rowsFromBreakdown(input);
  if (rows.length === 0) return;
  await input.db.insert(usageEvents).values(rows).onConflictDoNothing();
}
