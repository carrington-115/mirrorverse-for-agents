import { z } from "zod";

const jsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([jsonPrimitive, z.array(jsonValue), z.record(z.string(), jsonValue)]),
);
export const jsonObject = z.record(z.string(), jsonValue);

const parameterValue = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("static"), value: jsonValue }),
  z.object({ mode: z.literal("expression"), expr: z.string() }),
  z.object({
    mode: z.literal("from_ai"),
    name: z.string(),
    description: z.string(),
    type: z.enum(["string", "number", "boolean", "json"]),
    required: z.boolean(),
  }),
]);

const parameterMap = z.record(z.string(), parameterValue);

const position = z.object({ x: z.number(), y: z.number() });

const nodeBase = {
  id: z.string().min(1),
  name: z.string().min(1),
  position,
  type: z.string().min(1),
  typeVersion: z.number().int().min(1),
  notes: z.string().nullable(),
  disabled: z.boolean(),
  continueOnFail: z.boolean(),
};

const retryPolicy = z.object({
  maxAttempts: z.number().int().min(1).max(10),
  backoff: z.enum(["exponential", "linear", "none"]),
  initialDelayMs: z.number().int().min(0),
});

const httpAuth = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("basic"), username: z.string(), password: z.string() }),
  z.object({ kind: z.literal("bearer"), token: z.string() }),
  z.object({ kind: z.literal("header"), headerName: z.string(), headerValue: z.string() }),
  z.object({ kind: z.literal("oauth2"), connectionId: z.string() }),
]);

const chatChannel = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("web") }),
  z.object({ kind: z.literal("slack"), channelId: z.string() }),
  z.object({ kind: z.literal("discord"), channelId: z.string() }),
  z.object({ kind: z.literal("telegram"), chatId: z.string() }),
  z.object({ kind: z.literal("whatsapp"), waba: z.string() }),
]);

const conditionOperator = z.enum([
  "equals",
  "not_equals",
  "contains",
  "starts_with",
  "ends_with",
  "greater_than",
  "less_than",
  "is_empty",
  "is_not_empty",
  "regex_match",
]);

const condition = z.object({
  id: z.string(),
  leftValue: parameterValue,
  rightValue: parameterValue,
  operator: conditionOperator,
});

const humanReviewChannel = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("chat") }),
  z.object({ kind: z.literal("email"), to: z.string() }),
  z.object({ kind: z.literal("slack"), channel: z.string() }),
  z.object({ kind: z.literal("discord"), channel: z.string() }),
  z.object({ kind: z.literal("telegram"), chatId: z.string() }),
  z.object({ kind: z.literal("whatsapp"), to: z.string() }),
  z.object({ kind: z.literal("teams"), channelId: z.string() }),
  z.object({ kind: z.literal("outlook"), to: z.string() }),
  z.object({ kind: z.literal("google_chat"), space: z.string() }),
]);

const manualTrigger = z.object({ ...nodeBase, kind: z.literal("trigger.manual") });
const cronTrigger = z.object({
  ...nodeBase,
  kind: z.literal("trigger.cron"),
  expression: z.string(),
  timezone: z.string(),
});
const webhookTrigger = z.object({
  ...nodeBase,
  kind: z.literal("trigger.webhook"),
  endpointSlug: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  verifySignature: z.boolean(),
  responseMode: z.enum(["on_received", "last_node", "respond_to_webhook_node"]),
  webhookId: z.string(),
});
const appEventTrigger = z.object({
  ...nodeBase,
  kind: z.literal("trigger.app_event"),
  mcpServerId: z.string(),
  eventName: z.string(),
  filters: parameterMap,
  webhookId: z.string(),
});
const formTrigger = z.object({
  ...nodeBase,
  kind: z.literal("trigger.form"),
  formSchema: jsonObject,
  webhookId: z.string(),
});
const chatMessageTrigger = z.object({
  ...nodeBase,
  kind: z.literal("trigger.chat_message"),
  channels: z.array(chatChannel),
});
const subWorkflowTrigger = z.object({
  ...nodeBase,
  kind: z.literal("trigger.sub_workflow"),
  inputSchema: jsonObject.nullable(),
});

const defaultRetryPolicy = { maxAttempts: 1, backoff: "none", initialDelayMs: 0 } as const;

const toolCall = z.object({
  ...nodeBase,
  kind: z.literal("core.tool_call"),
  mcpServerId: z.string(),
  toolName: z.string(),
  parameters: parameterMap,
  retry: retryPolicy.default(defaultRetryPolicy),
  toolMode: z.boolean().default(false),
});
const httpRequest = z.object({
  ...nodeBase,
  kind: z.literal("core.http_request"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  url: parameterValue,
  headers: parameterMap,
  query: parameterMap,
  body: parameterValue.nullable(),
  authentication: httpAuth.nullable(),
  retry: retryPolicy,
});
const codeNode = z.object({
  ...nodeBase,
  kind: z.literal("core.code"),
  language: z.enum(["typescript", "python"]),
  source: z.string(),
  timeoutSec: z.number().int().min(1),
  memoryMb: z.number().int().min(64),
  networkAllowlist: z.array(z.string()),
});
const subWorkflowCall = z.object({
  ...nodeBase,
  kind: z.literal("core.sub_workflow"),
  workflowId: z.string(),
  inputs: parameterMap,
});
const respondToWebhook = z.object({
  ...nodeBase,
  kind: z.literal("core.respond_to_webhook"),
  status: z.number().int().min(100).max(599),
  headers: parameterMap,
  body: parameterValue,
});

const agentNode = z.object({
  ...nodeBase,
  kind: z.literal("ai.agent"),
  systemPrompt: z.string(),
  userPromptTemplate: parameterValue,
  maxIterations: z.number().int().min(1).max(50),
  outputMode: z.enum(["text", "structured"]),
  outputSchema: jsonObject.nullable(),
});
const languageModelNode = z.object({
  ...nodeBase,
  kind: z.literal("ai.language_model"),
  provider: z.enum(["anthropic", "openai", "google", "mistral", "meta"]),
  model: z.string(),
  options: z.object({
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().min(1),
    topP: z.number().min(0).max(1).nullable(),
    stopSequences: z.array(z.string()),
  }),
});
const memoryNode = z.object({
  ...nodeBase,
  kind: z.literal("ai.memory"),
  strategy: z.enum(["buffer_window", "summary_buffer", "vector_retrieval", "postgres_chat"]),
  contextWindowLength: z.number().int().min(1),
  sessionKeyExpression: z.string().nullable(),
});
const outputParserNode = z.object({
  ...nodeBase,
  kind: z.literal("ai.output_parser"),
  strategy: z.enum(["json_schema", "structured", "auto_fix", "regex"]),
  schema: jsonObject.nullable(),
  autoFix: z.boolean(),
});
const retrieverNode = z.object({
  ...nodeBase,
  kind: z.literal("ai.retriever"),
  knowledgeBaseId: z.string(),
  topK: z.number().int().min(1),
  minScore: z.number().min(0).max(1).nullable(),
});

const ifNode = z.object({
  ...nodeBase,
  kind: z.literal("flow.if"),
  conditions: z.array(condition),
  combinator: z.enum(["and", "or"]),
});
const switchNode = z.object({
  ...nodeBase,
  kind: z.literal("flow.switch"),
  mode: z.enum(["expression", "rules"]),
  cases: z.array(z.object({ when: z.string(), outputIndex: z.number().int().min(0) })),
  defaultOutputIndex: z.number().int().min(0).nullable(),
});
const loopNode = z.object({
  ...nodeBase,
  kind: z.literal("flow.loop"),
  mode: z.enum(["split_in_batches", "for_each", "parallel"]),
  iterableExpression: z.string(),
  batchSize: z.number().int().min(1),
});
const mergeNode = z.object({
  ...nodeBase,
  kind: z.literal("flow.merge"),
  strategy: z.enum(["append", "merge_by_key", "wait_all", "multiplex"]),
  keyExpression: z.string().nullable(),
});
const filterNode = z.object({
  ...nodeBase,
  kind: z.literal("flow.filter"),
  conditions: z.array(condition),
  combinator: z.enum(["and", "or"]),
});
const waitNode = z.object({
  ...nodeBase,
  kind: z.literal("flow.wait"),
  until: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("duration"), ms: z.number().int().min(0) }),
    z.object({ mode: z.literal("timestamp"), iso: z.string() }),
    z.object({ mode: z.literal("expression"), expr: z.string() }),
    z.object({ mode: z.literal("webhook"), endpointSlug: z.string() }),
  ]),
});
const stopNode = z.object({
  ...nodeBase,
  kind: z.literal("flow.stop"),
  errorMessage: z.string().nullable(),
});
const noopNode = z.object({ ...nodeBase, kind: z.literal("flow.noop") });

const transformNode = z.object({
  ...nodeBase,
  kind: z.literal("transform"),
  op: z.enum([
    "edit_fields",
    "aggregate",
    "summarize",
    "limit",
    "sort",
    "rename_keys",
    "remove_duplicates",
    "split_out",
    "compare_datasets",
    "ai_transform",
  ]),
  config: jsonObject,
});

const humanReviewNode = z.object({
  ...nodeBase,
  kind: z.literal("human.review"),
  channel: humanReviewChannel,
  promptTemplate: parameterValue,
  responseSchema: jsonObject.nullable(),
  timeoutSec: z.number().int().min(1),
  onTimeout: z.enum(["abort", "continue", "default"]),
  defaultValue: jsonValue.nullable(),
});

const skillCallNode = z.object({
  ...nodeBase,
  kind: z.literal("skill.call"),
  skillSlug: z.string(),
  skillVersionNumber: z.number().int().min(1).nullable(),
  inputs: parameterMap,
});

const stickyNoteNode = z.object({
  ...nodeBase,
  kind: z.literal("editor.sticky_note"),
  content: z.string(),
  width: z.number().min(50),
  height: z.number().min(50),
  color: z.number().int().min(0),
});

export const workflowNode = z.discriminatedUnion("kind", [
  manualTrigger,
  cronTrigger,
  webhookTrigger,
  appEventTrigger,
  formTrigger,
  chatMessageTrigger,
  subWorkflowTrigger,
  toolCall,
  httpRequest,
  codeNode,
  subWorkflowCall,
  respondToWebhook,
  agentNode,
  languageModelNode,
  memoryNode,
  outputParserNode,
  retrieverNode,
  ifNode,
  switchNode,
  loopNode,
  mergeNode,
  filterNode,
  waitNode,
  stopNode,
  noopNode,
  transformNode,
  humanReviewNode,
  skillCallNode,
  stickyNoteNode,
]);

const connectionKind = z.enum([
  "main",
  "ai_languageModel",
  "ai_memory",
  "ai_tool",
  "ai_outputParser",
  "ai_retriever",
  "ai_chain",
]);

export const workflowConnection = z.object({
  id: z.string(),
  kind: connectionKind,
  fromNodeId: z.string(),
  fromOutputIndex: z.number().int().min(0),
  toNodeId: z.string(),
  toInputIndex: z.number().int().min(0),
  condition: z.string().nullable(),
});

const workflowSettings = z.object({
  executionOrder: z.literal("v1"),
  binaryMode: z.enum(["memory", "separate"]),
  errorWorkflowId: z.string().nullable(),
  timezone: z.string(),
  executionTimeoutSec: z.number().int().min(1).nullable(),
  saveExecutionProgress: z.boolean(),
  saveDataSuccessExecution: z.enum(["all", "none"]),
  saveDataErrorExecution: z.enum(["all", "none"]),
});

const documentBase = {
  schemaVersion: z.literal(1),
  metadata: z.object({
    title: z.string().min(1).max(200),
    description: z.string().nullable(),
    notes: z.string().nullable(),
  }),
  settings: workflowSettings,
  nodes: z.array(workflowNode).min(1),
  connections: z.array(workflowConnection),
  variables: z.record(z.string(), jsonValue),
  staticData: jsonObject.nullable(),
};

const automationDocument = z.object({ ...documentBase, kind: z.literal("automation") });
const voiceAgentDocument = z.object({ ...documentBase, kind: z.literal("voice-agent") });
const chatAgentDocument = z.object({ ...documentBase, kind: z.literal("chat-agent") });
const codeDocument = z.object({
  ...documentBase,
  kind: z.literal("code"),
  entrypointNodeId: z.string(),
});

export const workflowDocumentSchema = z.discriminatedUnion("kind", [
  automationDocument,
  voiceAgentDocument,
  chatAgentDocument,
  codeDocument,
]);

export type WorkflowDocumentInput = z.infer<typeof workflowDocumentSchema>;
export type WorkflowNodeInput = z.infer<typeof workflowNode>;
export type WorkflowConnectionInput = z.infer<typeof workflowConnection>;
