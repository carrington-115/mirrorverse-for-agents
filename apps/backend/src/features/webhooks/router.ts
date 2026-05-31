import { z } from "zod";

import { router } from "../../trpc/init.js";
import { workspaceProc } from "../../trpc/middleware.js";
import { createWebhookInput, deleteWebhookInput } from "./inputs.js";
import { createWebhook, deleteWebhook, listWorkspaceWebhooks } from "./repo.js";
import {
  listEndpointsByWorkspace,
  regenerateEndpointSecret,
} from "./webhook-endpoints-repo.js";

export const webhooksRouter = router({
  list: workspaceProc.query(({ ctx }) =>
    listWorkspaceWebhooks(ctx.db, ctx.workspaceId),
  ),

  create: workspaceProc
    .input(createWebhookInput)
    .mutation(({ ctx, input }) =>
      createWebhook(ctx.db, ctx.workspaceId, input),
    ),

  delete: workspaceProc
    .input(deleteWebhookInput)
    .mutation(({ ctx, input }) =>
      deleteWebhook(ctx.db, input.webhookId, ctx.workspaceId),
    ),

  listEndpoints: workspaceProc.query(({ ctx }) =>
    listEndpointsByWorkspace(ctx.db, ctx.workspaceId),
  ),

  regenerateSecret: workspaceProc
    .input(z.object({ endpointId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      regenerateEndpointSecret(ctx.db, ctx.workspaceId, input.endpointId),
    ),
});
