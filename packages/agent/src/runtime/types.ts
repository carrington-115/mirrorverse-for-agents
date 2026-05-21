import type { Tool, UIMessage } from "ai";
import type { Database } from "@mirrorverse/db";

import type { StepUsageBreakdown } from "../billing";

export type AgentLifecycleEvent =
  | { readonly kind: "message_started"; readonly messageId: string }
  | {
      readonly kind: "tool_use_started";
      readonly messageId: string;
      readonly toolUseId: string;
      readonly toolName: string;
    }
  | {
      readonly kind: "tool_use_completed";
      readonly messageId: string;
      readonly toolUseId: string;
      readonly isError: boolean;
    }
  | { readonly kind: "message_completed"; readonly messageId: string };

export interface UsageEvent {
  readonly model: string;
  readonly breakdown: StepUsageBreakdown;
}

export interface FinishEvent {
  readonly responseMessage: UIMessage;
  readonly messages: UIMessage[];
}

export interface RunMirropilotDeps {
  readonly db: Database;
  readonly userId: string;
  readonly workspaceId: string;
  readonly chatId: string;
  readonly messages: UIMessage[];
  readonly model?: string;
  readonly builderModel?: string;
  readonly maxSteps?: number;
  readonly additionalTools?: Record<string, Tool>;
  readonly systemPromptSuffix?: string;
  readonly onUsage?: (event: UsageEvent) => Promise<void> | void;
  readonly onLifecycleEvent?: (event: AgentLifecycleEvent) => Promise<void> | void;
  readonly onFinish?: (event: FinishEvent) => Promise<void> | void;
}

export interface RunMirropilotResult {
  readonly response: Response;
}
