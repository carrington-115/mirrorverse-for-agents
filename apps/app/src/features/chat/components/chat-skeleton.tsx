"use client";

export function ChatSkeleton() {
  return (
    <div className="px-4 flex h-full w-full items-center justify-center">
      <div className="max-w-3xl gap-6 flex w-full flex-col">
        <div className="flex items-center justify-center">
          <div className="size-12 animate-pulse rounded-xl bg-muted/30" aria-hidden />
          <div className="ml-2 h-10 w-48 animate-pulse rounded-lg bg-muted/30" aria-hidden />
        </div>

        <div className="rounded-2xl bg-muted/20">
          <div className="px-4 py-4">
            <div className="h-4 animate-pulse w-2/5 rounded-md bg-muted/40" aria-hidden />
          </div>
          <div className="gap-2 px-3 pb-3 pt-2.5 flex items-center justify-between">
            <div className="gap-2 flex">
              <div className="h-7 w-7 animate-pulse rounded-lg bg-muted/35" aria-hidden />
              <div className="h-7 w-28 animate-pulse rounded-lg bg-muted/35" aria-hidden />
            </div>
            <div className="size-8 animate-pulse rounded-full bg-muted/35" aria-hidden />
          </div>
        </div>

        <div className="gap-3 sm:grid-cols-3 grid grid-cols-1">
          {[55, 65, 48].map((titleWidth) => (
            <div key={titleWidth} className="p-4 rounded-2xl bg-muted/20">
              <div
                className="h-3.5 animate-pulse rounded-sm bg-muted/40"
                style={{ width: `${titleWidth}%` }}
                aria-hidden
              />
              <div
                className="mt-2.5 h-2.5 animate-pulse w-full rounded-sm bg-muted/30"
                aria-hidden
              />
              <div
                className="mt-1.5 h-2.5 animate-pulse w-4/5 rounded-sm bg-muted/30"
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
