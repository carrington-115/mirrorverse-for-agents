import { notFound } from "next/navigation";
import { getAgentStore } from "@/lib/agent-store";
import AgentDetailHeader from "./_components/AgentDetailHeader";
import AgentTabNav from "./_components/AgentTabNav";

export default async function AgentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = getAgentStore().find((a) => a.id === id);
  if (!agent) notFound();

  return (
    <div className="flex flex-col gap-[var(--xl)] w-full">
      <AgentDetailHeader agent={agent} />
      <div className="rounded-[var(--radius)] border-[5px] border-[var(--border-1)] bg-[var(--body-background)] overflow-hidden">
        <AgentTabNav id={id} />
        <div className="p-[var(--xl)]">{children}</div>
      </div>
    </div>
  );
}
