"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { CostBreakdown, RunError, RunStepLog, RunStepStatus } from "@mirrorverse/types";
import { RunStatusBadge } from "./run-status-badge";
import { InputOutputViewer } from "./input-output-viewer";

interface Step {
  id: string;
  runId: string;
  nodeKind: string;
  status: RunStepStatus;
  input: unknown;
  output: unknown;
  error: RunError | null;
  cost: CostBreakdown;
  logs: readonly RunStepLog[];
  durationMs: number | null;
}

function CostCard({ step }: { step: Step }) {
  const total = step.cost.tokensIn + step.cost.tokensOut;
  return (
    <div className="gap-2 text-sm flex flex-col">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Input tokens</span>
        <span className="tabular-nums">{step.cost.tokensIn.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Cached tokens</span>
        <span className="tabular-nums">{step.cost.tokensInCached.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Output tokens</span>
        <span className="tabular-nums">{step.cost.tokensOut.toLocaleString()}</span>
      </div>
      <div className="font-medium flex justify-between">
        <span>Total tokens</span>
        <span className="tabular-nums">{total.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Estimated cost</span>
        <span className="tabular-nums">${(step.cost.costCents / 100).toFixed(4)}</span>
      </div>
    </div>
  );
}

export function StepDrawer({
  step,
  open,
  onClose,
}: {
  step: Step | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent side="right" className="sm:w-[480px] w-[420px] overflow-y-auto">
        {!step ? (
          <div className="gap-3 mt-4 flex flex-col">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="gap-2 pb-4">
              <div className="gap-2 flex items-center justify-between">
                <SheetTitle className="text-base">{step.nodeKind}</SheetTitle>
                <RunStatusBadge status={step.status} />
              </div>
            </SheetHeader>

            <Tabs defaultValue="input">
              <TabsList className="w-full">
                <TabsTrigger value="input" className="flex-1">
                  Input
                </TabsTrigger>
                <TabsTrigger value="output" className="flex-1">
                  Output
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex-1">
                  Logs
                </TabsTrigger>
                <TabsTrigger value="error" className="flex-1">
                  Error
                </TabsTrigger>
                <TabsTrigger value="cost" className="flex-1">
                  Cost
                </TabsTrigger>
              </TabsList>

              <TabsContent value="input" className="mt-3">
                <InputOutputViewer data={step.input} />
              </TabsContent>

              <TabsContent value="output" className="mt-3">
                <InputOutputViewer data={step.output} />
              </TabsContent>

              <TabsContent value="logs" className="mt-3">
                {step.logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No logs.</p>
                ) : (
                  <div className="p-3 max-h-96 text-xs space-y-1 overflow-auto rounded-md bg-muted font-mono">
                    {step.logs.map((log, i) => (
                      <div key={i} className="gap-2 flex">
                        <span className="shrink-0 text-muted-foreground">
                          {new Date(log.ts).toISOString().slice(11, 23)}
                        </span>
                        <span
                          className={
                            log.level === "error"
                              ? "text-red-500"
                              : log.level === "warn"
                                ? "text-amber-500"
                                : ""
                          }
                        >
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="error" className="mt-3">
                {!step.error ? (
                  <p className="text-sm text-muted-foreground">No error.</p>
                ) : (
                  <div className="gap-3 flex flex-col">
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {step.error.kind}
                      </p>
                      <p className="mt-1 text-sm">{step.error.message}</p>
                    </div>
                    {step.error.stack && (
                      <pre className="text-xs p-3 max-h-48 overflow-auto rounded-md bg-muted font-mono break-all whitespace-pre-wrap">
                        {step.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cost" className="mt-3">
                <CostCard step={step} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
