import { WorkflowEditorPage } from "@/features/workflows/pages/workflow-editor-page";

export { metadata } from "@/features/workflows/pages/workflow-editor-page";

interface WorkflowEditorRouteProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: WorkflowEditorRouteProps) {
  const { id } = await params;
  return <WorkflowEditorPage workflowId={id} />;
}
