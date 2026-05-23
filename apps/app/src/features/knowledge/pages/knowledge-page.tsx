import { buildMetadata } from "@/lib/seo/metadata";
import { KnowledgeShell } from "@/features/knowledge/components/knowledge-shell";

export const metadata = buildMetadata({
  title: "Knowledge Bases",
  description: "Manage knowledge bases to ground your agents.",
  noIndex: true,
});

export function KnowledgePage() {
  return <KnowledgeShell />;
}
