import { notFound } from "next/navigation";
import { getAgentStore } from "@/lib/agent-store";
import AgentToolsPanel from "./_components/agent-tools-panel";

export default async function AgentToolsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = getAgentStore().find((a) => a.id === id);
  if (!agent) notFound();

  return <AgentToolsPanel tools={agent.tools ?? []} />;
}
