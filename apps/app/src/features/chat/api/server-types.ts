import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@mirrorverse/backend";

type Outputs = inferRouterOutputs<AppRouter>;

export type ChatBundle = Outputs["chats"]["get"];
export type ChatRow = ChatBundle["chat"];
export type ChatMessageRow = ChatBundle["messages"][number];
export type ChatListEntry = Outputs["chats"]["list"][number];
