"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchUserProfile } from "./endpoints";

export function useUserProfileQuery(userId: string, orgId: string) {
  return useQuery({
    queryKey: queryKeys.auth.profile(userId, orgId),
    queryFn: () => fetchUserProfile(userId, orgId),
    enabled: Boolean(userId) && Boolean(orgId),
  });
}
