"use client";

export function ChatSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-4 py-6 flex-1 overflow-hidden">
        <div className="max-w-3xl space-y-8 mx-auto">
          <div className="gap-3 flex items-start">
            <div className="size-8 animate-pulse shrink-0 rounded-full bg-muted/40" aria-hidden />
            <div className="space-y-2 pt-1 flex-1">
              <div className="h-4 animate-pulse w-3/4 rounded-md bg-muted/40" aria-hidden />
              <div className="h-4 animate-pulse w-1/2 rounded-md bg-muted/30" aria-hidden />
              <div className="h-4 animate-pulse w-2/3 rounded-md bg-muted/25" aria-hidden />
            </div>
          </div>

          <div className="flex justify-end">
            <div className="h-9 w-48 animate-pulse rounded-2xl bg-muted/35" aria-hidden />
          </div>

          <div className="gap-3 flex items-start">
            <div className="size-8 animate-pulse shrink-0 rounded-full bg-muted/40" aria-hidden />
            <div className="space-y-2 pt-1 flex-1">
              <div className="h-4 animate-pulse w-2/3 rounded-md bg-muted/40" aria-hidden />
              <div className="h-4 animate-pulse w-5/6 rounded-md bg-muted/30" aria-hidden />
              <div className="h-4 animate-pulse w-2/5 rounded-md bg-muted/25" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="h-14 animate-pulse w-full rounded-2xl bg-muted/25" aria-hidden />
        </div>
      </div>
    </div>
  );
}
