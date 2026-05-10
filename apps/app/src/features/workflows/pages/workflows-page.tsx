import { buildMetadata } from "@/lib/seo/metadata";
import { WorkflowsShell } from "@/features/workflows/components/workflows-shell";

export const metadata = buildMetadata({
  title: "Workflows",
  description: "Browse, search, and run your agent workflows.",
  noIndex: true,
});

export function WorkflowsPage() {
  return <WorkflowsShell />;
}
