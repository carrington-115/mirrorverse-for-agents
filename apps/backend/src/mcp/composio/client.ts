import { Composio, jsonSchemaToZodSchema } from "@composio/core";
import { tool } from "ai";
import { env } from "@mirrorverse/env/backend";
import type { Tool } from "ai";

function makeClient(): Composio | null {
  if (!env.COMPOSIO_API_KEY) return null;
  return new Composio({ apiKey: env.COMPOSIO_API_KEY });
}

const _client = makeClient();

export function getComposioInstance(): Composio {
  if (!_client) throw new Error("COMPOSIO_API_KEY is not configured");
  return _client;
}

export function isComposioConfigured(): boolean {
  return _client !== null;
}

export async function listComposioTools(
  workspaceId: string,
): Promise<Record<string, Tool>> {
  const composio = getComposioInstance();

  const connected = await composio.connectedAccounts.list({
    userIds: [workspaceId],
    statuses: ["ACTIVE"],
  });
  const toolkitSlugs = [...new Set(connected.items.map((a) => a.toolkit.slug))];
  if (toolkitSlugs.length === 0) return {};

  const rawTools = await composio.tools.getRawComposioTools({
    toolkits: toolkitSlugs,
  });

  const result: Record<string, Tool> = {};
  for (const raw of rawTools) {
    const slug = (raw as { slug: string }).slug;
    const description = (raw as { description?: string }).description ?? slug;
    const inputParams = (raw as { inputParameters?: Record<string, unknown> })
      .inputParameters ?? {
      type: "object",
      properties: {},
    };
    try {
      const parameters = jsonSchemaToZodSchema(
        inputParams as Record<string, unknown>,
      );
      result[slug] = tool({ description, inputSchema: parameters });
    } catch {
      // Skip tools whose schemas can't be converted
    }
  }
  return result;
}

export async function getComposioAuthRedirectUrl(
  workspaceId: string,
  appSlug: string,
  _callbackUrl?: string,
): Promise<string | null> {
  const composio = getComposioInstance();
  const connectionReq = await composio.toolkits.authorize(workspaceId, appSlug);
  const redirectUrl = (connectionReq as { redirectUrl?: string | null })
    .redirectUrl;
  return redirectUrl ?? null;
}
