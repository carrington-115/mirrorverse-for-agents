import { eq, schema, type Database } from "@mirrorverse/db";

import { CostTracker, RunState, ZERO_COST } from "../workflows/runtime";
import { interpretAgent } from "../workflows/runtime/interpreters/agent";
import { serializeError } from "../workflows/runtime/step-writer";
import * as repo from "../workflows/repo";
import { checkRunLimit, recordRunStarted } from "../billing/run-limits";

const { workflowRuns } = schema;

// Generic / workflow-agnostic: answers using whichever workflow is currently
// flagged via `respondsToSlackMentions`. Returns null if no workflow is
// flagged, or the flagged workflow's document has no `ai.agent` node — the
// caller skips replying in either case.
export async function runSlackAgent(
  db: Database,
  messageText: string,
): Promise<string | null> {
  const flagged = await repo.getSlackAgentWorkflowDocument(db);
  if (!flagged) return null;

  const { workspaceId, workflowId, workflowVersionId, document } = flagged;
  const agentNode = document.nodes.find((n) => n.type === "ai.agent");
  if (!agentNode) return null;

  const runLimit = await checkRunLimit(db, workspaceId);
  if (!runLimit.ok) return runLimit.message;

  const startedAt = new Date();
  const [run] = await db
    .insert(workflowRuns)
    .values({
      workspaceId,
      workflowId,
      workflowVersionId,
      status: "running",
      triggerNodeId: agentNode.id,
      triggerKind: "trigger.slack",
      triggerPayload: { text: messageText },
      startedAt,
      cost: ZERO_COST,
    })
    .returning({ id: workflowRuns.id });

  if (!run) return null;
  await recordRunStarted(db, workspaceId);

  const costTracker = new CostTracker();

  try {
    const result = await interpretAgent(
      agentNode,
      messageText,
      new RunState({}),
      document,
      workspaceId,
      run.id,
      db,
      costTracker,
    );

    const finishedAt = new Date();
    await db
      .update(workflowRuns)
      .set({
        status: "succeeded",
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        cost: costTracker.getTotal(),
      })
      .where(eq(workflowRuns.id, run.id));

    return typeof result.output === "string"
      ? result.output
      : JSON.stringify(result.output);
  } catch (err) {
    const finishedAt = new Date();
    await db
      .update(workflowRuns)
      .set({
        status: "failed",
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        cost: costTracker.getTotal(),
        error: serializeError(err, agentNode.id),
      })
      .where(eq(workflowRuns.id, run.id));

    throw err;
  }
}
