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

  // Composio may signal auth errors as a result object rather than throwing.
  const r = result as Record<string, unknown>;
  if (r?.successful === false || r?.error) {
    const msg = String(r?.error ?? r?.message ?? "").toLowerCase();
    if (
      msg.includes("connected account") ||
      msg.includes("not connected") ||
      msg.includes("authenticate") ||
      msg.includes("oauth")
    ) {
      const appSlug = toolSlug.split("_")[0]?.toLowerCase() ?? toolSlug;
      throw new NeedsAuthError(appSlug, "");
    }
  }

  return result;
}
