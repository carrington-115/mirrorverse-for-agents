"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import { mapDbPhoneToFrontend, mapDbCallToFrontend } from "./types";

export function useListNumbersQuery() {
  const trpc = useTRPC();
  const q = useQuery(trpc.voice.listNumbers.queryOptions());
  return { ...q, data: q.data?.map(mapDbPhoneToFrontend) };
}

export function useSearchNumbersQuery(
  input: { countryCode: string; contains?: string; source: "managed" | "byo" },
  enabled: boolean,
) {
  const trpc = useTRPC();
  return useQuery({ ...trpc.voice.searchNumbers.queryOptions(input), enabled });
}

export function useListCallsByPhoneQuery(phoneNumberId: string) {
  const trpc = useTRPC();
  const q = useQuery({
    ...trpc.voice.listCallsByPhone.queryOptions({ phoneNumberId }),
    enabled: Boolean(phoneNumberId),
  });
  return { ...q, data: q.data?.map(mapDbCallToFrontend) };
}
