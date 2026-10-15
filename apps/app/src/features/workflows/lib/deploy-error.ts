import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";

export interface DeployIssue {
  nodeId: string | null;
  code: string;
  message: string;
}

// Extracts per-node validation issues the backend attaches to a failed
// deploy (`data.details.issues`). Returns [] for any other error.
export function getDeployIssues(error: unknown): DeployIssue[] {
  if (!(error instanceof TRPCClientError)) return [];
  const details = (error.data as { details?: { issues?: unknown } | null } | null)?.details;
  const issues = details?.issues;
  if (!Array.isArray(issues)) return [];
  return issues.filter(
    (i): i is DeployIssue =>
      typeof i === "object" && i !== null && typeof (i as DeployIssue).message === "string",
  );
}

export function showDeployErrorToast(error: unknown) {
  const issues = getDeployIssues(error);
  if (issues.length === 0) {
    toast.error(error instanceof Error ? error.message : "Deploy failed");
    return;
  }
  toast.error(
    issues.length === 1 ? "Can't deploy this workflow" : `Can't deploy: ${issues.length} problems`,
    {
      description: issues.map((i) => `• ${i.message}`).join("\n"),
    },
  );
}
