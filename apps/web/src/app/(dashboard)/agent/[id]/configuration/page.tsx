import { notFound } from "next/navigation";
import { getAgentStore } from "@/lib/agent-store";
import AgentConfigurationForm from "./_components/AgentConfigurationForm";

export default async function AgentConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = getAgentStore().find((a) => a.id === id);
  if (!agent) notFound();

  return <AgentConfigurationForm />;
}
