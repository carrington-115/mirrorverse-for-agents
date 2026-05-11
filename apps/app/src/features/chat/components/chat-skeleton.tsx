"use client";

import { cn } from "@/lib/utils";

function BubbleSkeleton({ align, width }: { align: "left" | "right"; width: string }) {
  return (
    <div
      className={cn(
        "px-1 my-6 mx-auto flex w-full max-w-[780px]",
        align === "right" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "h-10 animate-pulse rounded-2xl bg-muted/60",
          align === "right" ? "rounded-tr-sm" : "rounded-tl-sm",
        )}
        style={{ width }}
        aria-hidden
      />
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-4 flex-1 overflow-hidden">
        <BubbleSkeleton align="right" width="55%" />
        <BubbleSkeleton align="left" width="70%" />
        <BubbleSkeleton align="right" width="40%" />
        <BubbleSkeleton align="left" width="65%" />
      </div>
      <div className="p-3 border-t border-border">
        <div className="gap-2 mx-auto flex w-full max-w-[780px] items-end">
          <div className="h-11 animate-pulse flex-1 rounded-2xl bg-muted/60" aria-hidden />
          <div className="size-10 animate-pulse shrink-0 rounded-full bg-muted/60" aria-hidden />
        </div>
      </div>
    </div>
  );
}
