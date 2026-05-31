import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { env } from "@mirrorverse/env/backend";

import { TRPC_ENDPOINT } from "../../config";
import { createContext } from "../../trpc/context";
import { appRouter } from "../../trpc/router";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: TRPC_ENDPOINT,
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError({ error, path }) {
      if (env.NODE_ENV === "development") {
        console.error(`[trpc] ${path ?? "<no-path>"}: ${error.message}`);
      }
    },
  });

export { handler as GET, handler as POST };
