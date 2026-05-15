import { randomUUID } from "node:crypto";

import { getDb } from "@mirrorverse/db";

import { authenticateRequest, type AuthenticatedUser } from "../lib/auth";
import { makeLogger, type Logger } from "../lib/logger";

export type ContextUser = AuthenticatedUser;

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
  const user = await authenticateRequest(req);
  return { db, requestId, logger, user };
}
