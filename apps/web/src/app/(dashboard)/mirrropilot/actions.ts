"use server";

import { randomUUID } from "crypto";

export async function generateSessionId(): Promise<string> {
  return randomUUID();
}
