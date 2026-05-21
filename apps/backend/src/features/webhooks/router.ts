import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";
import { createWebhookInput, deleteWebhookInput } from "./inputs";
import { createWebhook, deleteWebhook, listWorkspaceWebhooks } from "./repo";

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
});
