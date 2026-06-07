import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, schema } from "@mirrorverse/db";

import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";

const { workspaceEnvVars } = schema;

// Standard POSIX env var name: letters/underscores/digits, must start with letter or underscore.
const nameSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(
    /^[A-Za-z_][A-Za-z0-9_]*$/,
    "Name must start with a letter or underscore and contain only letters, digits, and underscores",
  );

export const envVarsRouter = router({
  list: workspaceProc.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: workspaceEnvVars.id,
        name: workspaceEnvVars.name,
        createdAt: workspaceEnvVars.createdAt,
        updatedAt: workspaceEnvVars.updatedAt,
      })
      .from(workspaceEnvVars)
      .where(eq(workspaceEnvVars.workspaceId, ctx.workspaceId))
      .orderBy(asc(workspaceEnvVars.name));
  }),

  upsert: workspaceProc
    .input(
      z.object({
        name: nameSchema,
        value: z.string().min(1).max(32_768),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(workspaceEnvVars)
        .values({
          workspaceId: ctx.workspaceId,
          name: input.name,
          value: input.value,
          createdBy: ctx.user.id,
        })
        .onConflictDoUpdate({
          target: [workspaceEnvVars.workspaceId, workspaceEnvVars.name],
          set: {
            value: input.value,
            updatedAt: new Date(),
          },
        })
        .returning({
          id: workspaceEnvVars.id,
          name: workspaceEnvVars.name,
          createdAt: workspaceEnvVars.createdAt,
          updatedAt: workspaceEnvVars.updatedAt,
        });
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return row;
    }),

  delete: workspaceProc
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(workspaceEnvVars)
        .where(
          and(
            eq(workspaceEnvVars.id, input.id),
            eq(workspaceEnvVars.workspaceId, ctx.workspaceId),
          ),
        )
        .returning({ id: workspaceEnvVars.id });
      if (result.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { id: input.id };
    }),
});
