import { serve } from "inngest/edge";

import { getDb } from "@mirrorverse/db";

import { buildInngestFunctions, inngest } from "../src/features/inngest";

const handler = serve({
  client: inngest,
  functions: buildInngestFunctions(getDb()),
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
