import { ensureUserWorkspace } from "../features/tenancy/repo";
import { middleware, publicProcedure, TRPCError } from "./init";

const timing = middleware(async ({ ctx, path, type, next }) => {
  const start = Date.now();
  try {
    const result = await next();
    ctx.logger.info(`${type} ${path}`, { ms: Date.now() - start, ok: true });
    return result;
  } catch (err) {
    ctx.logger.warn(`${type} ${path}`, {
      ms: Date.now() - start,
      ok: false,
      err: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
});

const enforceUser = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const ensureWorkspace = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  const workspaceId = await ensureUserWorkspace(ctx.db, ctx.user.id);
  return next({ ctx: { ...ctx, user: ctx.user, workspaceId } });
});

export const publicProc = publicProcedure.use(timing);
export const protectedProc = publicProcedure.use(timing).use(enforceUser);
export const workspaceProc = publicProcedure.use(timing).use(ensureWorkspace);
