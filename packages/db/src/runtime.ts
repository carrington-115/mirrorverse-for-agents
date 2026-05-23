import { sql } from "drizzle-orm";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { env } from "@mirrorverse/env/backend";

import { connectToDatabase, type Database } from "./client";
import { auditLog } from "./schema";

let cachedAdminDb: Database | null = null;
let cachedRuntimeDb: Database | null = null;
let cachedSupabase: SupabaseClient | null = null;
let warnedRuntimeFallback = false;

/**
 * Privileged connection (Supabase service role / `postgres`). Bypasses
 * Row-Level Security. Use it only for migrations, the workspace-resolution
 * bootstrap (`ensureUserWorkspace`), and `withServiceRole`. Per-request tenant
 * work must go through {@link withTenantContext} instead.
 */
export function getDb(): Database {
  if (!cachedAdminDb) {
    cachedAdminDb = connectToDatabase(env.DATABASE_URL);
  }
  return cachedAdminDb;
}

/**
 * Runtime connection backed by the non-privileged `app_user` role that RLS
 * policies gate. Do not query this directly — with no `app.current_workspace`
 * set, workspace-scoped tables return zero rows. Reach it via
 * {@link withTenantContext}, which opens a transaction and sets the GUC.
 */
export function getRuntimeDb(): Database {
  if (!cachedRuntimeDb) {
    const url = env.RUNTIME_DATABASE_URL ?? env.DATABASE_URL;
    if (!env.RUNTIME_DATABASE_URL && !warnedRuntimeFallback) {
      warnedRuntimeFallback = true;
      console.warn(
        "[db] RUNTIME_DATABASE_URL is unset; falling back to DATABASE_URL. " +
          "Row-Level Security is INERT until a non-privileged app_user connection is configured.",
      );
    }
    cachedRuntimeDb = connectToDatabase(url);
  }
  return cachedRuntimeDb;
}

/**
 * Runs `fn` inside a transaction on the runtime connection with the tenant
 * GUC set, so RLS scopes every query to `workspaceId`. The `tx` is a
 * `Database`, so pass it wherever a `db` argument is expected.
 *
 * `set_config(..., true)` is transaction-local, so the setting is rolled back
 * with the transaction and never leaks across pooled connections. The value is
 * bound as a parameter — never string-interpolated — so a hostile workspace id
 * cannot inject SQL.
 */
export async function withTenantContext<T>(
  workspaceId: string,
  fn: (tx: Database) => Promise<T>,
): Promise<T> {
  return getRuntimeDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_workspace', ${workspaceId}, true)`);
    return fn(tx);
  });
}

export interface ServiceRoleOptions {
  /** Why this cross-tenant access is needed. Recorded in the audit log. */
  readonly reason: string;
  /** Workspace the access relates to, if any. */
  readonly workspaceId?: string;
  /** Acting user, if a request is behind it. Defaults to "system". */
  readonly userId?: string;
}

/**
 * Escape hatch for genuinely cross-tenant work (admin dashboards, analytics,
 * background reconciliation). Runs on the privileged connection that bypasses
 * RLS and writes an `audit_log` row recording the reason. Prefer
 * {@link withTenantContext} for anything scoped to a single workspace.
 */
export async function withServiceRole<T>(
  options: ServiceRoleOptions,
  fn: (db: Database) => Promise<T>,
): Promise<T> {
  const db = getDb();
  await db.insert(auditLog).values({
    workspaceId: options.workspaceId ?? null,
    userId: options.userId ?? "system",
    action: "service_role.access",
    payload: { reason: options.reason },
  });
  return fn(db);
}

export function getSupabase(): SupabaseClient {
  if (!cachedSupabase) {
    cachedSupabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedSupabase;
}

export interface VerifiedToken {
  readonly sub: string;
  readonly email: string;
}

const cachedJwtSecret = new TextEncoder().encode(env.JWT_SECRET);
const jwksUrl = new URL("/auth/v1/.well-known/jwks.json", env.SUPABASE_URL);
const jwks = createRemoteJWKSet(jwksUrl);

// Supabase signs JWTs with either HS256 (legacy, shared secret) or an
// asymmetric algorithm (RS256/ES256, public keys via JWKS). We inspect the
// header `alg` and pick the verifier accordingly. Both keep verification
// local — no network roundtrip per request once the JWKS is cached.
export async function verifyToken(token: string): Promise<VerifiedToken | null> {
  try {
    const header = decodeProtectedHeader(token);
    const { payload } =
      header.alg === "HS256"
        ? await jwtVerify(token, cachedJwtSecret)
        : await jwtVerify(token, jwks);
    if (typeof payload.sub !== "string") return null;
    const email = typeof payload.email === "string" ? payload.email : "";
    return { sub: payload.sub, email };
  } catch (err) {
    if (env.NODE_ENV === "development") {
      console.error("[auth] verifyToken failed:", err instanceof Error ? err.message : err);
    }
    return null;
  }
}
