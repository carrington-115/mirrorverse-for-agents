import { notFound } from "next/navigation";
import { getAgentStore } from "@/lib/agent-store";
import AgentDetailHeader from "./_components/agent-detail-header";
import AgentTabNav from "./_components/agent-tab-nav";

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
    <div className="flex w-full flex-col gap-(--xl)">
      <AgentDetailHeader agent={agent} />
      <div className="overflow-hidden rounded-(--radius) border-[5px] border-(--border-1) bg-(--body-background)">
        <AgentTabNav id={id} />
        <div className="p-(--xl)">{children}</div>
      </div>
    </div>
  );
}
