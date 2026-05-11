import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { env } from "@mirrorverse/env/backend";

import { connectToDatabase, type Database } from "./client";

let cachedDb: Database | null = null;
let cachedSupabase: SupabaseClient | null = null;

export function getDb(): Database {
  if (!cachedDb) {
    cachedDb = connectToDatabase(env.DATABASE_URL);
  }
  return cachedDb;
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
