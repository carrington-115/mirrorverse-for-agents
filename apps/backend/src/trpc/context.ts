import { randomUUID } from "node:crypto";

import { getDb, verifyToken } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { BEARER } from "../config";
import { makeLogger, type Logger } from "../lib/logger";

export interface ContextUser {
  readonly id: UserId;
  readonly email: string;
}

export interface Context {
  readonly db: ReturnType<typeof getDb>;
  readonly requestId: string;
  readonly logger: Logger;
  readonly user: ContextUser | null;
}

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  const db = getDb();
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  const logger = makeLogger(requestId);

  const auth = req.headers.get("authorization");
  const match = auth?.match(BEARER);
  const token = match?.[1];

  if (!token) {
    return { db, requestId, logger, user: null };
  }

  const verified = await verifyToken(token);
  if (!verified) {
    return { db, requestId, logger, user: null };
  }

  return {
    db,
    requestId,
    logger,
    user: { id: verified.sub as UserId, email: verified.email },
  };
}
