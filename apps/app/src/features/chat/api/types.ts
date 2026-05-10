export type MessageRole = "user" | "agent";

export type MessageStatus =
  | "pending"
  | "thinking"
  | "streaming"
  | "tool_use"
  | "complete"
  | "error";

export type BlockType = "thinking" | "text" | "tool_use";

export interface ThinkingBlock {
  type: "thinking";
  content: string;
  startedAt?: number;
  durationMs?: number;
}

export interface TextBlock {
  type: "text";
  content: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  toolName: string;
  toolId: string;
  input?: Record<string, unknown>;
  result?: string;
  status: "running" | "done" | "error";
}

export type ContentBlock = ThinkingBlock | TextBlock | ToolUseBlock;

export interface Source {
  title: string;
  url: string;
  domain: string;
}

export interface AgentMessageData {
  id: string;
  role: MessageRole;
  status: MessageStatus;
  blocks: ContentBlock[];
  sources?: Source[];
  createdAt: Date;
}
