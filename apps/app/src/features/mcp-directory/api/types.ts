import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@mirrorverse/backend";

type Outputs = inferRouterOutputs<AppRouter>;

export type DirectoryEntry = Outputs["mcpDirectory"]["list"]["items"][number];
export type DirectoryListResult = Outputs["mcpDirectory"]["list"];
