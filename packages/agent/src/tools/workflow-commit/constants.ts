export const WORKFLOW_KINDS = ["automation", "voice-agent", "chat-agent", "code"] as const;

export type WorkflowKind = (typeof WORKFLOW_KINDS)[number];

export const MAX_BUILDER_ATTEMPTS = 2;
export const MAX_BUILDER_STEPS = 50;

export const DEFAULT_BUILDER_MODEL = "claude-sonnet-4-5";

export const DEFAULT_WORKFLOW_SETTINGS = {
  executionOrder: "v1",
  binaryMode: "memory",
  errorWorkflowId: null,
  timezone: "UTC",
  executionTimeoutSec: 300,
  saveExecutionProgress: true,
  saveDataSuccessExecution: "all",
  saveDataErrorExecution: "all",
} as const;
