import { withTenantContext } from "@mirrorverse/db";

import { ensureUserWorkspace } from "../features/tenancy/repo";
import { checkRateLimit, type RateLimitName } from "../lib/rate-limit";
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
  // Capture in a local const so the non-null narrowing survives into the
  // nested withTenantContext closure (property narrowing on ctx.user does not).
  const user = ctx.user;
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  // Resolve the workspace on the privileged connection (ctx.db): the bootstrap
  // reads workspaces/members/profiles by user id before any tenant context
  // exists, so it must run with RLS bypassed.
  const workspaceId = await ensureUserWorkspace(ctx.db, user.id);
  // Run the resolver inside a tenant transaction on the runtime (app_user)
  // connection so RLS scopes every query to this workspace. ctx.db is swapped
  // for the transaction handle — services keep using ctx.db unchanged.
  return withTenantContext(workspaceId, async (tx) => {
    const result = await next({
      ctx: { ...ctx, user, workspaceId, db: tx },
    });
    // tRPC resolves (rather than throws) on a downstream error, so the
    // transaction would otherwise commit. Re-throw to roll it back, leaving
    // no partial writes behind.
    if (!result.ok) throw result.error;
    return result;
  });
});

export const publicProc = publicProcedure.use(timing);
export const protectedProc = publicProcedure.use(timing).use(enforceUser);
export const workspaceProc = publicProcedure.use(timing).use(ensureWorkspace);

/** Per-user rate limit for a procedure. Chain after an auth middleware. */
export function rateLimited(name: RateLimitName) {
  return middleware(async ({ ctx, next }) => {
    const result = await checkRateLimit(name, ctx.user?.id ?? "anonymous");
    if (!result.ok) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many requests. Try again in ${result.retryAfterSeconds}s.`,
      });
    }
    return next();
  });
}
