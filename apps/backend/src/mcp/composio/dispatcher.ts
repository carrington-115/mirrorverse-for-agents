import { getComposioInstance } from "./client";

export class NeedsAuthError extends Error {
  constructor(
    readonly appSlug: string,
    readonly redirectUrl: string,
  ) {
    super("auth_required");
    this.name = "NeedsAuthError";
  }
}

export async function invokeComposioTool(
  toolSlug: string,
  args: Record<string, unknown>,
  workspaceId: string,
): Promise<unknown> {
  const composio = getComposioInstance();

  const result = await composio.tools.execute(toolSlug, {
    userId: workspaceId,
    arguments: args,
    dangerouslySkipVersionCheck: true,
  } as Parameters<typeof composio.tools.execute>[1]);

  return result;
}
