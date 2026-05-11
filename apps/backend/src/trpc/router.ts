import { router } from "./init";

import { authRouter } from "../features/auth/router";
import { billingRouter } from "../features/billing/router";
import { chatsRouter } from "../features/chats/router";
import { knowledgeRouter } from "../features/knowledge/router";
import { mcpDirectoryRouter } from "../features/mcp-directory/router";
import { runsRouter } from "../features/runs/router";
import { skillsRouter } from "../features/skills/router";
import { tenancyRouter } from "../features/tenancy/router";
import { toolsRouter } from "../features/tools/router";
import { voiceRouter } from "../features/voice/router";
import { workflowsRouter } from "../features/workflows/router";

export const appRouter = router({
  auth: authRouter,
  billing: billingRouter,
  chats: chatsRouter,
  knowledge: knowledgeRouter,
  mcpDirectory: mcpDirectoryRouter,
  runs: runsRouter,
  skills: skillsRouter,
  tenancy: tenancyRouter,
  tools: toolsRouter,
  voice: voiceRouter,
  workflows: workflowsRouter,
});

export type AppRouter = typeof appRouter;
