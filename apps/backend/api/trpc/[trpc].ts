import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { env } from "@mirrorverse/env/backend";

import { TRPC_ENDPOINT } from "../../src/config.js";
import { createContext } from "../../src/trpc/context.js";
import { appRouter } from "../../src/trpc/router.js";

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
