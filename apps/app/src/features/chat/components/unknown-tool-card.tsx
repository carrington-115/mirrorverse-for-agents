import type { ToolUIPart } from "ai";

interface UnknownToolCardProps {
  part: ToolUIPart;
}

export function UnknownToolCard({ part }: UnknownToolCardProps) {
  const name = part.type.startsWith("tool-") ? part.type.slice("tool-".length) : part.type;
  const isError = part.state === "output-error";

  return (
    <div className="px-3 py-2 text-sm rounded-md border border-dashed text-muted-foreground">
      <span className="text-xs font-mono">{name}</span>
      {isError && <span className="ml-2 text-destructive">(error)</span>}
    </div>
  );
}
