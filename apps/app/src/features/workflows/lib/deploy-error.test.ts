import { TRPCClientError } from "@trpc/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { toast } from "sonner";

import { getDeployIssues, showDeployErrorToast } from "./deploy-error";

function trpcError(data: unknown) {
  const err = new TRPCClientError<never>("Can't deploy: boom");
  Object.defineProperty(err, "data", { value: data });
  return err;
}

const issue = { nodeId: "n1", code: "invalid_cron", message: "Bad cron" };

beforeEach(() => vi.clearAllMocks());

describe("getDeployIssues", () => {
  it("reads issues from tRPC error details", () => {
    expect(getDeployIssues(trpcError({ details: { issues: [issue, { bogus: 1 }] } }))).toEqual([
      issue,
    ]);
  });

  it("returns [] for other errors", () => {
    expect(getDeployIssues(new Error("x"))).toEqual([]);
    expect(getDeployIssues(trpcError({ details: null }))).toEqual([]);
  });
});

describe("showDeployErrorToast", () => {
  it("lists issues in the description", () => {
    showDeployErrorToast(trpcError({ details: { issues: [issue, issue] } }));
    expect(toast.error).toHaveBeenCalledWith("Can't deploy: 2 problems", {
      description: "• Bad cron\n• Bad cron",
    });
  });

  it("uses the singular title for one issue", () => {
    showDeployErrorToast(trpcError({ details: { issues: [issue] } }));
    expect(toast.error).toHaveBeenCalledWith("Can't deploy this workflow", expect.anything());
  });

  it("falls back to the error message", () => {
    showDeployErrorToast(new Error("Network down"));
    expect(toast.error).toHaveBeenCalledWith("Network down");
    showDeployErrorToast("weird");
    expect(toast.error).toHaveBeenCalledWith("Deploy failed");
  });
});
