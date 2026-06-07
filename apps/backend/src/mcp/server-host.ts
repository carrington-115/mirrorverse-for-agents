import type { Database } from "@mirrorverse/db";
import { type ZodTypeAny } from "zod";

export interface FirstPartyContext {
  readonly db: Database;
  readonly workspaceId: string;
  readonly userId: string;
}

export interface FirstPartyTool {
  readonly description: string;
  readonly inputSchema: ZodTypeAny;
  handler(args: unknown, ctx: FirstPartyContext): Promise<unknown>;
}

export interface FirstPartyServer {
  readonly id: string;
  readonly tools: Record<string, FirstPartyTool>;
}

class UnknownServerError extends Error {
  constructor(serverId: string, toolName: string) {
    super(`first_party: unknown server "${serverId}" or tool "${toolName}"`);
  }
}

class ServerHost {
  private readonly servers = new Map<string, FirstPartyServer>();

  register(server: FirstPartyServer): void {
    this.servers.set(server.id, server);
  }

  async dispatch(
    serverId: string,
    toolName: string,
    rawArgs: unknown,
    ctx: FirstPartyContext,
  ): Promise<unknown> {
    const server = this.servers.get(serverId);
    if (!server) throw new UnknownServerError(serverId, toolName);

    const toolDef = server.tools[toolName];
    if (!toolDef) throw new UnknownServerError(serverId, toolName);

    const args = toolDef.inputSchema.parse(rawArgs);
    return toolDef.handler(args, ctx);
  }

  listTools(serverId: string): Array<{ name: string; description: string }> {
    const server = this.servers.get(serverId);
    if (!server) return [];
    return Object.entries(server.tools).map(([name, def]) => ({
      name,
      description: def.description,
    }));
  }

  getToolSchema(serverId: string, toolName: string): ZodTypeAny | undefined {
    return this.servers.get(serverId)?.tools[toolName]?.inputSchema;
  }
}

export const serverHost = new ServerHost();
