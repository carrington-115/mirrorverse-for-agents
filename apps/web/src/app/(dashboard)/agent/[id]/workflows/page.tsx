import { notFound } from "next/navigation";
import { getAgentStore } from "@/lib/agent-store";
import WorkflowsClientPage from "./_components/WorkflowsClientPage";

export default async function AgentWorkflowsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = getAgentStore().find((a) => a.id === id);
  if (!agent) notFound();

  return <WorkflowsClientPage agent={agent} />;
}
