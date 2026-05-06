import { UserLock } from "lucide-react";



export default function AgentAdvancedPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-[var(--xs)] py-[var(--4xl)] text-center">
      <UserLock className="size-8 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">Advanced settings</p>
      <p className="text-xs text-muted-foreground max-w-[340px]">
        Advanced configuration for this agent is not available yet. Check back
        soon.
      </p>
    </div>
  );
}
