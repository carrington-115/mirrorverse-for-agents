"use server";

import { randomUUID } from "node:crypto";

export async function generateSessionId(): Promise<string> {
  return randomUUID();
}
