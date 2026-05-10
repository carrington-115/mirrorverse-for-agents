import WorkflowDetailPage from "./_components/workflow-detail-page";

interface WorkflowPageProps {
  params: Promise<{ workflowId: string }>;
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { workflowId } = await params;
  return <WorkflowDetailPage workflowId={workflowId} />;
}
