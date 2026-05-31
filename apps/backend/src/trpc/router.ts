import { router } from "./init.js";

import { auditRouter } from "../features/audit/router.js";
import { authRouter } from "../features/auth/router.js";
import { billingRouter } from "../features/billing/router.js";
import { chatsRouter } from "../features/chats/router.js";
import { connectionsRouter } from "../features/connections/router.js";
import { knowledgeRouter } from "../features/knowledge/router.js";
import { runsRouter } from "../features/runs/router.js";
import { skillsRouter } from "../features/skills/router.js";
import { tenancyRouter } from "../features/tenancy/router.js";
import { toolsRouter } from "../features/tools/router.js";
import { voiceRouter } from "../features/voice/router.js";
import { webhooksRouter } from "../features/webhooks/router.js";
import { workflowsRouter } from "../features/workflows/router.js";

export const appRouter = router({
  audit: auditRouter,
  auth: authRouter,
  billing: billingRouter,
  chats: chatsRouter,
  connections: connectionsRouter,
  knowledge: knowledgeRouter,
  runs: runsRouter,
  skills: skillsRouter,
  tenancy: tenancyRouter,
  tools: toolsRouter,
  voice: voiceRouter,
  webhooks: webhooksRouter,
  workflows: workflowsRouter,
});

export type AppRouter = typeof appRouter;
