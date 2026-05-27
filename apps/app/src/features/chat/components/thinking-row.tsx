import { AssistantAvatar } from "./assistant-avatar";

const DOT_DELAYS = ["0ms", "200ms", "400ms"] as const;

export function ThinkingRow() {
  return (
    <div className="my-6 gap-3 flex w-full">
      <AssistantAvatar />
      <div className="gap-1.5 py-1 flex items-center">
        {DOT_DELAYS.map((delay) => (
          <span
            key={delay}
            className="animate-thinking-dot size-2 rounded-full bg-muted-foreground/50"
            style={{ animationDelay: delay }}
          />
        ))}
      </div>
    </div>
  );
}
