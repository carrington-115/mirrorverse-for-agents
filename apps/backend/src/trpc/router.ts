import { router } from "./init";

import { auditRouter } from "../features/audit/router";
import { authRouter } from "../features/auth/router";
import { billingRouter } from "../features/billing/router";
import { chatsRouter } from "../features/chats/router";
import { connectionsRouter } from "../features/connections/router";
import { knowledgeRouter } from "../features/knowledge/router";
import { mcpDirectoryRouter } from "../features/mcp-directory/router";
import { runsRouter } from "../features/runs/router";
import { skillsRouter } from "../features/skills/router";
import { tenancyRouter } from "../features/tenancy/router";
import { toolsRouter } from "../features/tools/router";
import { voiceRouter } from "../features/voice/router";
import { webhooksRouter } from "../features/webhooks/router";
import { workflowsRouter } from "../features/workflows/router";

export const appRouter = router({
  audit: auditRouter,
  auth: authRouter,
  billing: billingRouter,
  chats: chatsRouter,
  connections: connectionsRouter,
  knowledge: knowledgeRouter,
  mcpDirectory: mcpDirectoryRouter,
  runs: runsRouter,
  skills: skillsRouter,
  tenancy: tenancyRouter,
  tools: toolsRouter,
  voice: voiceRouter,
  webhooks: webhooksRouter,
  workflows: workflowsRouter,
});

export type AppRouter = typeof appRouter;
