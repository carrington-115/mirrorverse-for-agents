import { UserLock } from "lucide-react";

export default function AgentAdvancedPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-(--xs) py-(--4xl) text-center">
      <UserLock className="size-8 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">Advanced settings</p>
      <p className="text-xs max-w-[340px] text-muted-foreground">
        Advanced configuration for this agent is not available yet. Check back soon.
      </p>
    </div>
  );
}
