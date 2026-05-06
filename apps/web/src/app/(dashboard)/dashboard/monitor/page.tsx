import CurrentActivityCard from "./_components/ActivityCard";
import AgentsTable from "./_components/AgentsTable";
import AgentConversationsTable from "./_components/ConversationsTable";
import ToolsTable from "./_components/ToolsTable";

export default function MonitorPage() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="max-w-full grid grid-cols-3 gap-4">
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
