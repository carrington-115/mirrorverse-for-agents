import { buildMetadata } from "@/lib/seo/metadata";
import { WorkflowEditor } from "@/features/workflows/components/workflow-editor";

export const metadata = buildMetadata({
  title: "Workflow editor",
  description: "Design and edit workflows with the Mirroverse editor.",
  noIndex: true,
});

interface WorkflowEditorPageProps {
  workflowId: string;
}

export function WorkflowEditorPage({ workflowId }: WorkflowEditorPageProps) {
  return <WorkflowEditor workflowId={workflowId} />;
}
