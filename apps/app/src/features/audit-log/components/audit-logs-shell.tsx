"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";

import { useTRPC } from "@/lib/trpc/client";

import { AuditLogTable } from "./audit-log-table";

function useDefaultWorkspaceId() {
  const trpc = useTRPC();
  return useQuery(trpc.auth.me.queryOptions());
}

export function AuditLogsShell() {
  const { data, isLoading } = useDefaultWorkspaceId();
  const workspaceId = data?.profile.defaultWorkspaceId ?? "";

  if (isLoading || !workspaceId) {
    return (
      <div className="gap-3 py-12 flex flex-col items-center text-center">
        <div className="p-3 rounded-full bg-muted">
          <ShieldAlert className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Loading&hellip;</p>
      </div>
    );
  }

  return <AuditLogTable workspaceId={workspaceId} />;
}
