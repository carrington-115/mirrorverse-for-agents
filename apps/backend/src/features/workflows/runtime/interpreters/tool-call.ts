import type { JsonValue } from "@mirrorverse/types";
import type { WorkflowNode } from "@mirrorverse/types";

import { invokeComposioTool } from "../../../../mcp/composio/dispatcher";
import { serverHost } from "../../../../mcp/server-host";
import "../../../../mcp/servers/index";
import { ZERO_COST } from "../cost-tracker";
import type { RunState } from "../run-state";
import type { ExecutionContext, InterpretResult } from "./types";

interface ToolCallParams {
  readonly mcpServerId?: string;
  readonly toolName?: string;
  readonly parameters?: Record<string, unknown>;
}

export async function interpretToolCall(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
  ctx: ExecutionContext,
): Promise<InterpretResult> {
  const raw = state.resolveParams(node.params, input) as ToolCallParams;

  const mcpServerId = raw.mcpServerId ?? "";
  const toolName = raw.toolName ?? "";
  const parameters = (raw.parameters ?? {}) as Record<string, unknown>;

  if (!toolName) throw new Error("core.tool_call: toolName is required");

  let result: unknown;

  if (mcpServerId === "composio" || mcpServerId === "") {
    result = await invokeComposioTool(toolName, parameters, ctx.workspaceId);
  } else if (mcpServerId.startsWith("first_party.")) {
    result = await serverHost.dispatch(mcpServerId, toolName, parameters, {
      db: ctx.db,
      workspaceId: ctx.workspaceId,
      userId: "",
    });
  } else {
    throw new Error(
      `core.tool_call: custom MCP server "${mcpServerId}" is not yet supported in the automation runtime`,
    );
  }

  return {
    output: (result ?? null) as JsonValue,
    nextPorts: ["main"],
    cost: ZERO_COST,
  };
}
