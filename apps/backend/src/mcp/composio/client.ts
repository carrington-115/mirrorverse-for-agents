import { Composio, jsonSchemaToZodSchema } from "@composio/core";
import { tool } from "ai";
import { env } from "@mirrorverse/env/backend";
import type { Tool } from "ai";
import { and, eq, isNull, schema, type Database } from "@mirrorverse/db";

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

export async function lookupComposioMcpServerId(
  db: Database,
): Promise<string | null> {
  const [row] = await db
    .select({ id: schema.mcpServers.id })
    .from(schema.mcpServers)
    .where(
      and(
        eq(schema.mcpServers.slug, "composio"),
        isNull(schema.mcpServers.workspaceId),
      ),
    )
    .limit(1);
  return row?.id ?? null;
}

export async function listConnectedApps(
  workspaceId: string,
): Promise<{ slug: string; name: string }[]> {
  if (!isComposioConfigured()) return [];
  const composio = getComposioInstance();
  const connected = await composio.connectedAccounts.list({
    userIds: [workspaceId],
    statuses: ["ACTIVE"],
  });
  return connected.items.map((a) => ({
    slug: a.toolkit.slug,
    name: (a.toolkit as { name?: string }).name ?? a.toolkit.slug,
  }));
}

export interface ToolkitInfo {
  readonly slug: string;
  readonly name: string;
  readonly logoUrl: string | null;
  readonly description: string | null;
  readonly toolsCount: number | null;
}

export async function getToolkitMetadata(
  slugs: string[],
): Promise<ToolkitInfo[]> {
  const composio = getComposioInstance();
  const results = await Promise.allSettled(
    slugs.map(async (slug) => {
      const tk = await composio.toolkits.get(slug);
      const meta = tk.meta as
        | { logo?: string; description?: string; toolsCount?: number }
        | undefined;
      return {
        slug,
        name: tk.name ?? slug,
        logoUrl: meta?.logo ?? null,
        description: meta?.description ?? null,
        toolsCount: meta?.toolsCount ?? null,
      };
    }),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<ToolkitInfo> => r.status === "fulfilled",
    )
    .map((r) => r.value);
}

export interface ComposioIntegrationTool {
  readonly slug: string;
  readonly description: string;
}

export interface ComposioIntegrationTrigger {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
}

export interface ComposioIntegration {
  readonly slug: string;
  readonly name: string;
  readonly logoUrl: string | null;
  readonly description: string | null;
  readonly tools: readonly ComposioIntegrationTool[];
  readonly triggers: readonly ComposioIntegrationTrigger[];
}

export async function listComposioIntegrations(): Promise<
  ComposioIntegration[]
> {
  if (!isComposioConfigured()) return [];
  const composio = getComposioInstance();

  const allItems: Array<{ toolkit?: { slug?: string } }> = [];
  let cursor: string | undefined;
  do {
    const page = await composio.authConfigs.list({ limit: 100, cursor });
    const pageItems =
      (
        page as {
          items?: Array<{ toolkit?: { slug?: string } }>;
          nextCursor?: string | null;
        }
      ).items ?? [];
    allItems.push(...pageItems);
    const nextCursor = (page as { nextCursor?: string | null }).nextCursor;
    cursor = nextCursor ?? undefined;
  } while (cursor);

  const seenSlugs = new Set<string>();
  for (const item of allItems) {
    const slug = item.toolkit?.slug;
    if (slug) seenSlugs.add(slug);
  }
  const toolkitSlugs = [...seenSlugs];
  if (toolkitSlugs.length === 0) return [];

  const results = await Promise.allSettled(
    toolkitSlugs.map(async (slug): Promise<ComposioIntegration> => {
      const [tk, rawTools, rawTriggers] = await Promise.all([
        composio.toolkits.get(slug),
        composio.tools.getRawComposioTools({ toolkits: [slug] }),
        composio.triggers.listTypes({ toolkits: [slug] }),
      ]);
      const meta = tk.meta as
        | { logo?: string; description?: string }
        | undefined;
      const tools: ComposioIntegrationTool[] = (
        rawTools as Array<{ slug?: string; description?: string }>
      )
        .map((t) => ({ slug: t.slug ?? "", description: t.description ?? "" }))
        .filter((t) => t.slug.length > 0);
      const triggers: ComposioIntegrationTrigger[] = (rawTriggers.items ?? [])
        .map((t) => ({
          slug: t.slug,
          name: t.name,
          description: t.description,
        }))
        .filter((t) => t.slug.length > 0);

      return {
        slug,
        name: tk.name ?? slug,
        logoUrl: meta?.logo ?? null,
        description: meta?.description ?? null,
        tools,
        triggers,
      };
    }),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ComposioIntegration> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);
}

export async function getComposioAuthRedirectUrl(
  workspaceId: string,
  appSlug: string,
  callbackUrl: string,
): Promise<string | null> {
  const composio = getComposioInstance();

  // Composio deprecated POST /api/v3/connected_accounts for managed OAuth configs.
  // The new path is: resolve auth config ID for the toolkit, then call .link().
  const authConfigsPage = await composio.authConfigs.list({ toolkit: appSlug });
  const items = (authConfigsPage as { items?: { id: string }[] }).items;
  console.log(
    `[composio] authConfigs for "${appSlug}":`,
    JSON.stringify(items),
  );

  const authConfig = items?.[0];
  if (!authConfig) {
    console.warn(
      `[composio] No auth config found for toolkit "${appSlug}". The app may require a custom OAuth setup in the Composio dashboard.`,
    );
    return null;
  }

  const connectionReq = await composio.connectedAccounts.link(
    workspaceId,
    authConfig.id,
    {
      callbackUrl,
    },
  );
  console.log(
    `[composio] link() response for "${appSlug}":`,
    JSON.stringify(connectionReq),
  );

  const redirectUrl = (connectionReq as { redirectUrl?: string | null })
    .redirectUrl;
  if (!redirectUrl) {
    console.warn(
      `[composio] link() returned no redirectUrl for "${appSlug}" (authConfigId: ${authConfig.id}). App may use API-key auth.`,
    );
  }
  return redirectUrl ?? null;
}
