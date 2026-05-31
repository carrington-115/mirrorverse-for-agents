import { verifyToken } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { BEARER } from "../config.js";

export interface AuthenticatedUser {
  readonly id: UserId;
  readonly email: string;
}

export async function authenticateRequest(
  req: Request,
): Promise<AuthenticatedUser | null> {
  const auth = req.headers.get("authorization");
  const match = auth?.match(BEARER);
  const token = match?.[1];
  if (!token) return null;
  const verified = await verifyToken(token);
  if (!verified) return null;
  return { id: verified.sub as UserId, email: verified.email };
}
