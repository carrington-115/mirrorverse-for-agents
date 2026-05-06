import WorkflowDetailPage from "./_components/WorkflowDetailPage";

interface WorkflowPageProps {
  params: Promise<{ workflowId: string }>;
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { workflowId } = await params;
  return <WorkflowDetailPage workflowId={workflowId} />;
}
