import { schema } from "@mirrorverse/db";

import { middleware } from "../../trpc/init.js";

export const auditMutation = middleware(
  async ({ ctx, path, type, next, getRawInput }) => {
    const result = await next();

    if (type !== "mutation" || !ctx.user) return result;

    const rawInput = await getRawInput().catch(() => null);

    const workspaceId =
      rawInput != null &&
      typeof rawInput === "object" &&
      "workspaceId" in rawInput &&
      typeof (rawInput as Record<string, unknown>).workspaceId === "string"
        ? ((rawInput as Record<string, unknown>).workspaceId as string)
        : null;

    void ctx.db
      .insert(schema.auditLog)
      .values({
        userId: ctx.user.id,
        action: path,
        workspaceId,
        payload: (rawInput ?? null) as Record<string, unknown> | null,
      })
      .catch((err: unknown) =>
        ctx.logger.warn("audit_log insert failed", {
          err: err instanceof Error ? err.message : String(err),
        }),
      );

    return result;
  },
);
