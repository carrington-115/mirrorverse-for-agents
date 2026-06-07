import { and, eq, schema } from "@mirrorverse/db";
import { z } from "zod";

import { decryptSecret, encryptSecret } from "../../lib/encrypt";
import { NeedsAuthError } from "../composio/dispatcher";
import type { FirstPartyServer } from "../server-host";

const { connections, mcpServers } = schema;

const VAULT_SERVER_SLUG = "first_party.vault";

async function getVaultMcpServerId(
  db: Parameters<FirstPartyServer["tools"][string]["handler"]>[1]["db"],
): Promise<string> {
  const [row] = await db
    .select({ id: mcpServers.id })
    .from(mcpServers)
    .where(eq(mcpServers.slug, VAULT_SERVER_SLUG))
    .limit(1);
  if (!row) throw new Error("Vault MCP server row not seeded — run db:migrate");
  return row.id;
}

export const vaultServer: FirstPartyServer = {
  id: "first_party.vault",
  tools: {
    read_credential: {
      description:
        "Read an encrypted secret from the workspace vault. Returns the plaintext value. " +
        "Throws if the credential is not stored yet.",
      inputSchema: z.object({
        provider: z
          .string()
          .min(1)
          .describe("Credential provider slug, e.g. 'openai', 'stripe'"),
      }),
      async handler({ provider }: { provider: string }, ctx) {
        const [row] = await ctx.db
          .select({ credentialEncrypted: connections.credentialEncrypted })
          .from(connections)
          .where(
            and(
              eq(connections.workspaceId, ctx.workspaceId),
              eq(connections.appSlug, provider),
            ),
          )
          .limit(1);

        if (!row?.credentialEncrypted) {
          throw new NeedsAuthError(provider, "");
        }

        return { value: decryptSecret(row.credentialEncrypted) };
      },
    },

    write_credential: {
      description: "Encrypt and store a secret in the workspace vault.",
      inputSchema: z.object({
        provider: z
          .string()
          .min(1)
          .describe("Credential provider slug, e.g. 'openai', 'stripe'"),
        value: z
          .string()
          .min(1)
          .describe("The plaintext secret value to store"),
      }),
      async handler(
        { provider, value }: { provider: string; value: string },
        ctx,
      ) {
        const vaultMcpServerId = await getVaultMcpServerId(ctx.db);
        const encrypted = encryptSecret(value);

        const existing = await ctx.db
          .select({ id: connections.id })
          .from(connections)
          .where(
            and(
              eq(connections.workspaceId, ctx.workspaceId),
              eq(connections.appSlug, provider),
            ),
          )
          .limit(1);

        if (existing[0]) {
          await ctx.db
            .update(connections)
            .set({ credentialEncrypted: encrypted, status: "active" })
            .where(
              and(
                eq(connections.workspaceId, ctx.workspaceId),
                eq(connections.appSlug, provider),
              ),
            );
        } else {
          await ctx.db.insert(connections).values({
            workspaceId: ctx.workspaceId,
            mcpServerId: vaultMcpServerId,
            appSlug: provider,
            displayName: provider,
            status: "active",
            credentialKind: "api_key",
            credentialEncrypted: encrypted,
            createdBy: ctx.userId,
          });
        }

        return { ok: true };
      },
    },
  },
};
