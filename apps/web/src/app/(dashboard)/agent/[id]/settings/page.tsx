import { notFound } from "next/navigation";
import { getAgentStore } from "@/lib/agent-store";
import EscalationSettingsForm from "./_components/EscalationSettingsForm";

const DEFAULT_ESCALATION = {
  scenarios: {
    userRequestsHuman: true,
    negativeSentiment: true,
    agentStuck: true,
    toolCallFails: true,
    maxLengthExceeded: true,
  },
  destinations: { slack: true, zendesk: false, phoneTransfer: true },
  handoff: {
    includeTranscript: false,
    includeCustomerInfo: true,
    includeSummary: true,
  },
};

export default async function AgentSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = getAgentStore().find((a) => a.id === id);
  if (!agent) notFound();

  return (
    <EscalationSettingsForm initial={agent.escalation ?? DEFAULT_ESCALATION} />
  );
}
