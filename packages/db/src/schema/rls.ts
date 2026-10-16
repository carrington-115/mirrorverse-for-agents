import { sql, type SQL } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";

/**
 * Row-Level Security policy factories for tenant isolation (issue #31).
 *
 * Each policy gates a workspace-scoped table against `app.current_workspace`,
 * the GUC set per-request by `withTenantContext`. Policies target PUBLIC, so
 * every role connecting *without* the `BYPASSRLS` attribute (i.e. the runtime
 * `app_user`) is constrained; the privileged migration/service role bypasses
 * them. Adding a policy to a table makes drizzle-kit enable RLS on it.
 *
 * `current_setting(..., true)` uses missing_ok = true: an unset GUC yields
 * NULL and every predicate is false, so a query that escaped the application's
 * workspace filter sees zero rows (fail closed) rather than erroring.
 */

const currentWorkspace = sql`current_setting('app.current_workspace', true)`;

/**
 * Standard isolation for a table with a NOT NULL `workspace_id`: rows are
 * visible and writable only when their workspace matches the active tenant.
 */
export function tenantPolicy(table: string) {
  return pgPolicy(`${table}_tenant_isolation`, {
    as: "permissive",
    for: "all",
    using: sql`workspace_id = ${currentWorkspace}`,
    withCheck: sql`workspace_id = ${currentWorkspace}`,
  });
}

/**
 * Isolation for tables whose `workspace_id` is nullable because NULL marks a
 * global/built-in row readable by every tenant (`mcp_servers`, `agent_skills`).
 * Global rows stay readable; writes must target the active workspace, so a
 * tenant cannot create or mutate a global row.
 */
export function tenantOrGlobalPolicy(table: string) {
  return pgPolicy(`${table}_tenant_isolation`, {
    as: "permissive",
    for: "all",
    using: sql`workspace_id = ${currentWorkspace} or workspace_id is null`,
    withCheck: sql`workspace_id = ${currentWorkspace}`,
  });
}

/**
 * Isolation for a table with no `workspace_id` of its own — scoped transitively
 * through a parent row. `using` is the read/modify predicate (typically an
 * `exists (...)` against the parent); `withCheck` defaults to it but can be
 * tightened for writes (e.g. forbid writing rows under a global parent).
 */
export function transitivePolicy(table: string, using: SQL, withCheck: SQL = using) {
  return pgPolicy(`${table}_tenant_isolation`, {
    as: "permissive",
    for: "all",
    using,
    withCheck,
  });
}

/** The active-workspace GUC expression, for composing transitive predicates. */
export const activeWorkspaceSql = currentWorkspace;

/**
 * Access for global (non-tenant) tables the backend reads or updates at
 * runtime, e.g. `promo_codes`. Supabase's `ensure_rls` event trigger enables
 * RLS on every new public table, which hides all rows from `app_user` unless a
 * policy grants them. Scoped to `app_user` only so Supabase's `anon` /
 * `authenticated` API roles still see nothing.
 */
export function runtimePolicy(table: string, operation: "select" | "update") {
  return pgPolicy(`${table}_runtime_${operation}`, {
    as: "permissive",
    for: operation,
    to: "app_user",
    using: sql`true`,
    ...(operation === "update" ? { withCheck: sql`true` } : {}),
  });
}
