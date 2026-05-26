import { AssistantAvatar } from "./assistant-avatar";

const DOT_DELAYS = ["0ms", "150ms", "300ms"] as const;

export function ThinkingRow() {
  return (
    <div className="my-6 gap-3 flex w-full">
      <AssistantAvatar />
      <div className="gap-2 text-sm flex items-center text-muted-foreground">
        <span>Mirrorpilot is thinking</span>
        <span className="gap-0.5 flex">
          {DOT_DELAYS.map((delay) => (
            <span
              key={delay}
              className="size-1 animate-bounce rounded-full bg-muted-foreground/60"
              style={{ animationDelay: delay }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
