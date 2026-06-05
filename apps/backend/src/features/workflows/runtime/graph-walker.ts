import type {
  JsonValue,
  WorkflowDocument,
  WorkflowNode,
} from "@mirrorverse/types";
import type { GetStepTools } from "inngest";

import { inngest } from "../../inngest/client";
import { CostCapExceededError, ZERO_COST } from "./cost-tracker";

type StepTools = GetStepTools<typeof inngest>;
import { RunState } from "./run-state";
import {
  serializeError,
  stepRowId,
  writeStepResult,
  writeStepStart,
} from "./step-writer";
import { interpretTrigger } from "./interpreters/trigger";
import { interpretHttpRequest } from "./interpreters/http-request";
import { interpretToolCall } from "./interpreters/tool-call";
import { interpretTransform } from "./interpreters/transform";
import {
  LOOP_SIGNAL,
  STOP_SIGNAL,
  interpretFlowFilter,
  interpretFlowIf,
  interpretFlowLoop,
  interpretFlowMerge,
  interpretFlowNoop,
  interpretFlowStop,
  interpretFlowSwitch,
  interpretFlowWait,
  type StopSignal,
  type LoopSignal,
} from "./interpreters/flow";
import { interpretAgent } from "./interpreters/agent";
import { interpretHumanReview } from "./interpreters/human-review";
import type { ExecutionContext, InterpretResult } from "./interpreters/types";
import type { CostBreakdown, RunError, RunStatus } from "@mirrorverse/types";

export interface WalkResult {
  readonly status: RunStatus;
  readonly totalCost: CostBreakdown;
  readonly error: RunError | null;
}

interface AdjacencyEntry {
  readonly toNodeId: string;
  readonly fromPort: string;
  readonly toPort: string;
}

function buildMainAdjacency(
  doc: WorkflowDocument,
): Map<string, AdjacencyEntry[]> {
  const adj = new Map<string, AdjacencyEntry[]>();
  for (const conn of doc.connections) {
    // Only "main" data-flow connections drive the walker.
    if (conn.fromPort !== "main" && conn.fromPort !== "main-out") continue;
    const list = adj.get(conn.from) ?? [];
    list.push({
      toNodeId: conn.to,
      fromPort: conn.fromPort,
      toPort: conn.toPort,
    });
    adj.set(conn.from, list);
  }
  return adj;
}

function findNode(doc: WorkflowDocument, nodeId: string): WorkflowNode | null {
  return doc.nodes.find((n) => n.id === nodeId) ?? null;
}

/** Count how many main-flow incoming edges a node has (for merge detection). */
function buildIncomingCount(doc: WorkflowDocument): Map<string, number> {
  const count = new Map<string, number>();
  for (const conn of doc.connections) {
    if (conn.fromPort !== "main" && conn.fromPort !== "main-out") continue;
    count.set(conn.to, (count.get(conn.to) ?? 0) + 1);
  }
  return count;
}

interface QueueEntry {
  readonly nodeId: string;
  readonly input: JsonValue;
  /** Only set for loop body iterations. */
  readonly iterIndex?: number;
}

/**
 * Execute a single node inside an Inngest step and write the step row.
 * Returns the InterpretResult or throws — callers decide whether to abort.
 */
async function executeNode(
  node: WorkflowNode,
  input: JsonValue,
  ctx: ExecutionContext,
  step: StepTools,
  doc: WorkflowDocument,
  state: RunState,
  iterIndex?: number,
): Promise<InterpretResult | StopSignal | LoopSignal> {
  const rowId = stepRowId(ctx.runId, node.id, iterIndex);
  const stepInngestId =
    iterIndex !== undefined
      ? `node:${node.id}:iter:${iterIndex}`
      : `node:${node.id}`;

  const result = (await step.run(stepInngestId, async () => {
    const startedAt = new Date();
    await writeStepStart({
      db: ctx.db,
      id: rowId,
      workspaceId: ctx.workspaceId,
      runId: ctx.runId,
      nodeId: node.id,
      nodeKind: node.type,
      input,
    });

    try {
      let interpreted:
        | InterpretResult
        | typeof STOP_SIGNAL
        | ReturnType<typeof interpretFlowLoop>;

      switch (node.type) {
        case "trigger.manual":
        case "trigger.cron":
        case "trigger.webhook":
        case "trigger.app_event":
        case "trigger.inbound_call":
          interpreted = interpretTrigger(input);
          break;

        case "core.http_request":
          interpreted = await interpretHttpRequest(node, input, state);
          break;

        case "core.tool_call":
          interpreted = await interpretToolCall(node, input, state, ctx);
          break;

        case "core.respond_to_webhook":
          // Plumbing not yet active — pass input through so downstream nodes fire.
          interpreted = { output: input, nextPorts: ["main"] };
          break;

        case "ai.voice_agent":
          // Voice-agent workflows run via a separate VAPI pathway; halt the branch
          // if one somehow reaches the automation walker.
          interpreted = { output: input, nextPorts: [] };
          break;

        case "flow.if":
          interpreted = interpretFlowIf(node, input, state);
          break;

        case "flow.switch":
          interpreted = interpretFlowSwitch(node, input, state);
          break;

        case "flow.loop":
          interpreted = interpretFlowLoop(node, input, state);
          break;

        case "flow.filter":
          interpreted = interpretFlowFilter(node, input, state);
          break;

        case "flow.merge":
          interpreted = interpretFlowMerge(node, input);
          break;

        case "flow.wait":
          interpreted = await interpretFlowWait(node, input, state, step);
          break;

        case "flow.noop":
          interpreted = interpretFlowNoop(node, input);
          break;

        case "flow.stop":
          interpreted = interpretFlowStop();
          break;

        case "transform":
          interpreted = interpretTransform(node, input, state);
          break;

        case "ai.agent":
          interpreted = await interpretAgent(
            node,
            input,
            state,
            doc,
            ctx.workspaceId,
            ctx.runId,
            ctx.db,
            ctx.costTracker,
          );
          break;

        case "ai.language_model":
        case "ai.memory":
        case "ai.retriever":
        case "ai.output_parser":
          // AI subcomponent nodes don't execute in the main data flow.
          interpreted = { output: input, nextPorts: ["main"] };
          break;

        case "human.review":
          interpreted = await interpretHumanReview(
            node,
            input,
            state,
            ctx.runId,
            ctx.workspaceId,
            ctx.db,
            step,
          );
          break;

        case "editor.sticky_note":
          // Annotation only — no execution.
          interpreted = { output: input, nextPorts: [] };
          break;

        default:
          throw new Error(`Unsupported node type: ${node.type}`);
      }

      // Write success for non-signal results.
      if (
        interpreted !== STOP_SIGNAL &&
        !(
          "kind" in (interpreted as object) &&
          (interpreted as LoopSignal).kind === LOOP_SIGNAL
        )
      ) {
        const ir = interpreted as InterpretResult;
        if (ir.cost) ctx.costTracker.add(ir.cost);
        await writeStepResult({
          db: ctx.db,
          id: rowId,
          status: "succeeded",
          output: ir.output,
          cost: ir.cost ?? ZERO_COST,
          logs: ir.logs ?? [],
          startedAt,
        });
      } else if (interpreted === STOP_SIGNAL) {
        await writeStepResult({
          db: ctx.db,
          id: rowId,
          status: "succeeded",
          output: null,
          cost: ZERO_COST,
          startedAt,
        });
      } else {
        // Loop signal — just mark as succeeded (the walker handles iteration).
        await writeStepResult({
          db: ctx.db,
          id: rowId,
          status: "succeeded",
          output: null,
          cost: ZERO_COST,
          startedAt,
        });
      }

      return interpreted as InterpretResult | StopSignal | LoopSignal;
    } catch (err) {
      const runError = serializeError(err, node.id);
      await writeStepResult({
        db: ctx.db,
        id: rowId,
        status: "failed",
        error: runError,
        cost: ZERO_COST,
        startedAt,
      });
      throw err; // Re-throw so Inngest can retry the step.
    }
  })) as unknown as InterpretResult | StopSignal | LoopSignal;

  return result;
}

/**
 * Walk the workflow graph from `triggerNodeId`, executing each node as a
 * durable Inngest step. Returns the aggregate run result.
 */
export async function walkGraph(
  doc: WorkflowDocument,
  triggerNodeId: string,
  triggerPayload: JsonValue,
  ctx: ExecutionContext,
  step: StepTools,
): Promise<WalkResult> {
  const state = new RunState();
  const adj = buildMainAdjacency(doc);
  const incomingCount = buildIncomingCount(doc);

  // For merge nodes: track how many inputs have arrived and how many are expected.
  // expectedCount starts at the static edge count but is decremented when a
  // branch terminates early (stop signal, filter with no output, unmatched port)
  // so the merge can still fire with the branches that actually ran.
  const mergeInputs = new Map<
    string,
    { received: number; accumulated: JsonValue[] }
  >();
  const mergeExpected = new Map<string, number>(incomingCount);

  // Decrement a merge node's expected count and, if all outstanding branches
  // have now been accounted for, push the merge onto the queue.
  function notifyMergeSkipped(
    mergeNodeId: string,
    queueRef: QueueEntry[],
  ): void {
    const prev = mergeExpected.get(mergeNodeId) ?? 1;
    const next = Math.max(prev - 1, 0);
    mergeExpected.set(mergeNodeId, next);
    const existing = mergeInputs.get(mergeNodeId) ?? {
      received: 0,
      accumulated: [],
    };
    if (existing.received >= next && next > 0) {
      // All remaining branches have arrived — unblock the merge.
      mergeInputs.delete(mergeNodeId);
      queueRef.unshift({
        nodeId: mergeNodeId,
        input: existing.accumulated as JsonValue,
      });
    }
  }

  const queue: QueueEntry[] = [
    { nodeId: triggerNodeId, input: triggerPayload },
  ];

  try {
    while (queue.length > 0) {
      const entry = queue.shift()!;
      const node = findNode(doc, entry.nodeId);
      if (!node) continue;

      // Handle merge node gating.
      if (node.type === "flow.merge") {
        const expected = mergeExpected.get(node.id) ?? 1;
        const existing = mergeInputs.get(node.id) ?? {
          received: 0,
          accumulated: [],
        };
        existing.accumulated.push(entry.input);
        existing.received += 1;
        mergeInputs.set(node.id, existing);
        if (existing.received < expected) {
          // Not all branches have arrived yet; skip for now.
          continue;
        }
        // All branches ready; merge accumulated inputs as an array.
        const mergedInput: JsonValue = existing.accumulated as JsonValue;
        const mergeEntry: QueueEntry = { nodeId: node.id, input: mergedInput };
        queue.unshift(mergeEntry);
        mergeInputs.delete(node.id);
        continue;
      }

      const result = await executeNode(
        node,
        entry.input,
        ctx,
        step,
        doc,
        state,
        entry.iterIndex,
      );

      // Stop signal — notify any merge nodes directly reachable from here.
      if (result === STOP_SIGNAL) {
        const downstream = adj.get(node.id) ?? [];
        for (const edge of downstream) {
          const target = findNode(doc, edge.toNodeId);
          if (target?.type === "flow.merge") {
            notifyMergeSkipped(edge.toNodeId, queue);
          }
        }
        break;
      }

      // Loop signal — fan out iterations.
      if (
        typeof result === "object" &&
        result !== null &&
        "kind" in result &&
        (result as LoopSignal).kind === LOOP_SIGNAL
      ) {
        const loopResult = result as LoopSignal;
        const downstream = adj.get(node.id) ?? [];
        for (let i = 0; i < loopResult.items.length; i++) {
          const item = loopResult.items[i]!;
          for (const edge of downstream) {
            queue.push({ nodeId: edge.toNodeId, input: item, iterIndex: i });
          }
        }
        continue;
      }

      // Normal result.
      const ir = result as InterpretResult;
      state.set(node.id, ir.output);

      // Queue downstream nodes for each chosen output port.
      // For edges NOT followed, notify merge nodes so they aren't left waiting.
      const downstream = adj.get(node.id) ?? [];
      for (const edge of downstream) {
        const portMatches =
          ir.nextPorts.includes(edge.fromPort) ||
          ir.nextPorts.includes("main") ||
          ir.nextPorts.some(
            (p) => edge.fromPort === p || edge.fromPort === `${p}-out`,
          );
        if (portMatches) {
          queue.push({ nodeId: edge.toNodeId, input: ir.output });
        } else {
          const target = findNode(doc, edge.toNodeId);
          if (target?.type === "flow.merge") {
            notifyMergeSkipped(edge.toNodeId, queue);
          }
        }
      }

      ctx.costTracker.checkCap();
    }

    return {
      status: "succeeded",
      totalCost: ctx.costTracker.getTotal(),
      error: null,
    };
  } catch (err) {
    if (err instanceof CostCapExceededError) {
      return {
        status: "failed",
        totalCost: ctx.costTracker.getTotal(),
        error: {
          nodeId: null,
          kind: "internal",
          message: err.message,
          stack: null,
          retriable: false,
        },
      };
    }
    return {
      status: "failed",
      totalCost: ctx.costTracker.getTotal(),
      error: serializeError(err, null),
    };
  }
}
