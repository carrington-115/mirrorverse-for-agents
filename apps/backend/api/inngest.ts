import { serve } from "inngest/edge";

import { getDb } from "@mirrorverse/db";

import { buildInngestFunctions, inngest } from "../src/features/inngest";

// Privileged connection by design: Inngest functions are long-running,
// multi-step background jobs whose work can't be wrapped in a single
// request-scoped tenant transaction (steps and retries span transactions).
// They derive workspaceId from the event payload and filter explicitly.
// See packages/db/README "Tenant isolation".
const handler = serve({
  client: inngest,
  functions: buildInngestFunctions(getDb()),
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
