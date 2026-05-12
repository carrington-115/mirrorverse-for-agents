import Image from "next/image";

import { Shimmer } from "@mirrorverse/ui/ai-elements/shimmer";

import mirropilotIcon from "@/assets/mirropilot-icon.svg";
import { CHAT_STARTERS } from "@/features/chat/config";

interface ChatEmptyStateProps {
  onPickStarter: (prompt: string) => void;
  inputSlot: React.ReactNode;
}

export function ChatEmptyState({ onPickStarter, inputSlot }: ChatEmptyStateProps) {
  return (
    <div className="px-4 flex h-full w-full items-center justify-center">
      <div className="max-w-3xl gap-6 flex w-full flex-col">
        <BrandHeader />
        {inputSlot}
        <StarterGrid onPick={onPickStarter} />
      </div>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="gap-y-6 mb-12 flex items-center justify-center">
      <Image src={mirropilotIcon} alt="Mirropilot" width={36} height={36} priority />
      <Shimmer as="h1" className="font-bold text-4xl ml-2">
        Mirropilot
      </Shimmer>
    </div>
  );
}

function StarterGrid({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="gap-3 sm:grid-cols-3 grid grid-cols-1">
      {CHAT_STARTERS.map((s) => (
        <button
          key={s.title}
          type="button"
          onClick={() => onPick(s.prompt)}
          className="p-4 rounded-xl border border-border bg-card text-left transition-colors hover:border-foreground/30 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <div className="text-sm font-semibold text-foreground">{s.title}</div>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.prompt}</div>
        </button>
      ))}
    </div>
  );
}
