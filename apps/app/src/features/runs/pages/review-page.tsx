"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type State = "idle" | "approving" | "rejecting" | "done" | "error";

export function ReviewPage({ token }: { token: string }) {
  const trpc = useTRPC();
  const [state, setState] = useState<State>("idle");
  const [customResponse, setCustomResponse] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const { data, isLoading, error } = useQuery(trpc.runs.getReviewRequest.queryOptions({ token }));

  const { mutate: submit } = useMutation(
    trpc.runs.submitReviewByToken.mutationOptions({
      onSuccess: () => setState("done"),
      onError: () => setState("error"),
    }),
  );

  function handleApprove() {
    setState("approving");
    submit({ token, response: { approved: true } });
  }

  function handleReject() {
    setState("rejecting");
    submit({ token, response: { approved: false } });
  }

  function handleCustomSubmit() {
    setState("approving");
    let parsed: unknown = customResponse;
    try {
      parsed = customResponse.trim() ? JSON.parse(customResponse) : customResponse;
    } catch {
      parsed = customResponse;
    }
    submit({ token, response: parsed });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading review request&hellip;</p>
      </div>
    );
  }

  if (error) {
    const msg = (error as { message?: string }).message ?? "";
    if (msg.includes("expired")) {
      return (
        <ReviewStatus
          title="Review link expired"
          description="This review request has expired. The workflow has already timed out."
        />
      );
    }
    if (msg.includes("already_used")) {
      return (
        <ReviewStatus
          title="Already reviewed"
          description="This review request was already submitted."
        />
      );
    }
    return (
      <ReviewStatus
        title="Review not found"
        description="This review link is invalid or has been removed."
      />
    );
  }

  if (state === "done") {
    return (
      <ReviewStatus
        title="Response submitted"
        description="Your response has been recorded. The workflow will continue."
      />
    );
  }

  if (state === "error") {
    return (
      <ReviewStatus
        title="Submission failed"
        description="Something went wrong. Please try again or contact the workflow owner."
      />
    );
  }

  return (
    <div className="px-4 flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-lg p-8 shadow-sm w-full rounded-xl border bg-card">
        <h1 className="mb-2 text-xl font-semibold">Review request</h1>
        <p className="mb-6 text-sm whitespace-pre-wrap text-muted-foreground">
          {data?.promptText || "Please review and approve to continue."}
        </p>

        {!showCustom ? (
          <div className="gap-3 flex">
            <Button
              className="flex-1"
              onClick={handleApprove}
              disabled={state === "approving" || state === "rejecting"}
            >
              {state === "approving" ? "Submitting…" : "Approve"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReject}
              disabled={state === "approving" || state === "rejecting"}
            >
              {state === "rejecting" ? "Submitting…" : "Reject"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustom(true)}
              disabled={state === "approving" || state === "rejecting"}
            >
              Custom
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Custom response (JSON or plain text)</Label>
              <Textarea
                className="mt-1 text-xs font-mono"
                rows={4}
                placeholder='{ "approved": true, "comment": "Looks good" }'
                value={customResponse}
                onChange={(e) => setCustomResponse(e.target.value)}
              />
            </div>
            <div className="gap-2 flex">
              <Button
                className="flex-1"
                onClick={handleCustomSubmit}
                disabled={state === "approving"}
              >
                {state === "approving" ? "Submitting…" : "Submit"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCustom(false)}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewStatus({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-4 flex min-h-screen items-center justify-center">
      <div className="max-w-sm w-full text-center">
        <h1 className="mb-2 text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
