import CurrentActivityCard from "./_components/activity-card";
import AgentsTable from "./_components/agents-table";
import AgentConversationsTable from "./_components/conversations-table";
import ToolsTable from "./_components/tools-table";

export default function MonitorPage() {
  return (
    <div className="gap-4 flex w-full flex-col">
      <div className="gap-4 grid max-w-full grid-cols-3">
        <div className="col-span-2">
          <AgentsTable />
        </div>
        <div className="col-span-1">
          <CurrentActivityCard />
        </div>
      </div>
      <AgentConversationsTable />
      <ToolsTable />
    </div>
  );
}
