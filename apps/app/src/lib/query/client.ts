import { MutationCache, QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";

import { getPlanLimitMessage, showPlanLimitToast } from "@/features/billing/lib/plan-limit-error";

const isServer = typeof window === "undefined";

function makeQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        const message = getPlanLimitMessage(error);
        if (message) showPlanLimitToast(message);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
