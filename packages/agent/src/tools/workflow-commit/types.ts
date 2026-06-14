import type { Database } from "@mirrorverse/db";

import type {
  WorkflowConnectionInput,
  WorkflowDocumentInput,
  WorkflowNodeInput,
} from "../../schemas/workflow";
import type { WorkflowKind } from "./constants";

export interface BuilderMeta {
  readonly kind: WorkflowKind;
  readonly title: string;
  readonly description: string | null;
  readonly notes: string | null;
}

export interface BuilderState {
  meta: BuilderMeta | null;
  readonly nodes: WorkflowNodeInput[];
  readonly connections: WorkflowConnectionInput[];
}

export type WorkflowCommitProgressEmitter = (message: string) => void;

export interface WorkflowCommitDeps {
  readonly db: Database;
  readonly userId: string;
  readonly workspaceId: string;
  readonly chatId: string;
  readonly builderModel?: string;
  readonly onProgress?: WorkflowCommitProgressEmitter;
}

export interface SuccessfulWorkflowCommit {
  readonly workflowId: string;
  readonly workflowVersionId: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly kind: WorkflowKind;
  readonly document: WorkflowDocumentInput;
}

export type WorkflowCommitFailureCode = "MAX_WORKFLOWS_REACHED";

export type WorkflowCommitResult =
  | {
      readonly ok: true;
      readonly workflowId: string;
      readonly workflowVersionId: string;
      readonly versionNumber: number;
      readonly title: string;
      readonly kind: WorkflowKind;
      readonly document: WorkflowDocumentInput;
    }
  | { readonly ok: false; readonly error: string; readonly code?: WorkflowCommitFailureCode };
