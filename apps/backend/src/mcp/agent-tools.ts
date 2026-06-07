import type { Database } from "@mirrorverse/db";
import { tool, type Tool } from "ai";

import { NeedsAuthError } from "./composio/dispatcher";
import { serverHost } from "./server-host";
import "./servers/index";

interface Deps {
  readonly db: Database;
  readonly workspaceId: string;
  readonly userId: string;
}

// Returns a flat record of AI SDK tools for all first-party servers, keyed as
// "fp_{server}_{tool}" (e.g. "fp_vault_read_credential").
export function makeFirstPartyAiTools(deps: Deps): Record<string, Tool> {
  const serverIds = [
    "first_party.vault",
    "first_party.workflow",
    "first_party.schedule",
    "first_party.canvas",
    "first_party.knowledge",
  ] as const;

  const result: Record<string, Tool> = {};

  for (const serverId of serverIds) {
    const serverName = serverId.replace("first_party.", "");
    const toolList = serverHost.listTools(serverId);

    for (const { name: toolName, description } of toolList) {
      const inputSchema = serverHost.getToolSchema(serverId, toolName);
      if (!inputSchema) continue;

      const key = `fp_${serverName}_${toolName}`;
      result[key] = tool({
        description,
        inputSchema,
        execute: async (args: unknown) => {
          try {
            const res = await serverHost.dispatch(serverId, toolName, args, {
              db: deps.db,
              workspaceId: deps.workspaceId,
              userId: deps.userId,
            });
            return JSON.stringify(res);
          } catch (err) {
            if (err instanceof NeedsAuthError) {
              return (
                `Vault credential for "${err.appSlug}" not found. ` +
                `Ask the user for the value then call fp_vault_write_credential to store it.`
              );
            }
            throw err;
          }
        },
      });
    }
  }

  return result;
}
