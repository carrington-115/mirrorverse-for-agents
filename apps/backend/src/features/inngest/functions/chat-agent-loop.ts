import type { InngestFunction } from "inngest";
import type { Database } from "@mirrorverse/db";

import { inngest } from "../client";
import { chatAgentLoopEvent } from "../events";

export function makeChatAgentLoopFunction(_db: Database): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "chat.agent_loop",
      name: "Chat Agent Loop",
      triggers: [chatAgentLoopEvent],
      retries: 0, // non-retryable; client re-connects for resume
      concurrency: [{ key: "event.data.chatId", limit: 1 }],
    },
    async ({ event, step }) => {
      // Body implemented in issue #5.
      // step.waitForEvent will be used here to pause on credential interrupts,
      // resuming when connectionRequest.resumeEventName fires.
      const { chatId, workspaceId } = event.data;
      await step.run("init", async () => ({ chatId, workspaceId }));
    },
  );
}
