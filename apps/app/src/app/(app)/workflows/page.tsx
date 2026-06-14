import { buildMetadata } from "@/lib/seo/metadata";
import { WorkflowsRedirect } from "@/features/workflows/components/workflows-redirect";

export const metadata = buildMetadata({
  title: "Workflows",
  description: "Browse, search, and run your agent workflows.",
  noIndex: true,
});

export default function Page() {
  return <WorkflowsRedirect />;
}
