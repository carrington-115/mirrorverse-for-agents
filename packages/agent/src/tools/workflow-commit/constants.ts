import type { WorkflowStatus } from "@mirrorverse/types";

export const WORKFLOW_COMMIT_TOOL_NAME = "workflow_commit";

export const LOG_PREFIX = "[workflow_commit]";

export const WORKFLOW_KINDS = ["automation", "voice-agent", "chat-agent", "code"] as const;

export type WorkflowKind = (typeof WORKFLOW_KINDS)[number];

export const MAX_BUILDER_ATTEMPTS = 2;
export const MAX_BUILDER_STEPS = 50;

export const DEFAULT_BUILDER_MODEL = "claude-sonnet-4-5";

export const INITIAL_WORKFLOW_STATUS: WorkflowStatus = "draft";
export const INITIAL_VERSION_NUMBER = 1;
export const WORKFLOW_DOCUMENT_SCHEMA_VERSION = 1;

export const MAX_SUMMARY_LENGTH = 500;
export const MAX_INTENT_LENGTH = 8000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_ERROR_MESSAGE_LENGTH = 800;

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
