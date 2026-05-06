import { notFound } from "next/navigation";
import { getAgentStore } from "@/lib/agent-store";
import KnowledgeBasePanel from "./_components/KnowledgeBasePanel";

export default async function AgentKnowledgeBasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = getAgentStore().find((a) => a.id === id);
  if (!agent) notFound();

  return <KnowledgeBasePanel items={agent.knowledgeBase ?? []} />;
}
