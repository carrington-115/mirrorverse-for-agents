import type { WorkflowNodeInput } from "./workflow";

export interface PaletteEntry {
  readonly kind: string;
  readonly label: string;
  readonly category: PaletteCategory;
  readonly description: string;
}

export type PaletteCategory =
  | "Triggers"
  | "Core"
  | "AI"
  | "AI:Agents"
  | "AI:Subcomponents"
  | "Flow"
  | "Transform"
  | "Skill"
  | "Editor";

export interface AppEventEntry {
  readonly slug: string;
  readonly name: string;
}

export interface AppEventApp {
  readonly name: string;
  readonly events: readonly AppEventEntry[];
}

export const APP_EVENT_CATALOG: Record<string, AppEventApp> = {
  notion: {
    name: "Notion",
    events: [
      { slug: "NOTION_ALL_PAGE_EVENTS_TRIGGER", name: "All Page Events" },
      { slug: "NOTION_COMMENT_CREATED", name: "Comment Created" },
      { slug: "NOTION_COMMENTS_ADDED_TRIGGER", name: "New Comment" },
      { slug: "NOTION_DATABASE_CREATED", name: "Database Created" },
      { slug: "NOTION_DATASOURCE_CREATED", name: "Data Source Created" },
      { slug: "NOTION_DATASOURCE_SCHEMA_UPDATED", name: "Data Source Schema Updated" },
      { slug: "NOTION_PAGE_ADDED_TO_DATABASE", name: "New Page in Database" },
      { slug: "NOTION_PAGE_ADDED_TRIGGER", name: "Page Added to Page" },
      { slug: "NOTION_PAGE_CONTENT_UPDATED", name: "Page Content Updated" },
      { slug: "NOTION_PAGE_CREATED", name: "Page Created" },
      { slug: "NOTION_PAGE_PROPERTIES_UPDATED", name: "Page Properties Updated" },
      { slug: "NOTION_PAGE_UPDATED_TRIGGER", name: "Page Updated" },
      { slug: "NOTION_VIEW_CREATED", name: "View Created" },
    ],
  },
  slack: {
    name: "Slack",
    events: [
      { slug: "SLACK_CHANNEL_CREATED", name: "New Channel Created" },
      { slug: "SLACK_CHANNEL_MESSAGE_RECEIVED", name: "Channel Message Received" },
      { slug: "SLACK_DIRECT_MESSAGE_RECEIVED", name: "Direct Message Received" },
      { slug: "SLACK_MESSAGE_REACTION_ADDED", name: "Message Reaction Added" },
      { slug: "SLACK_REACTION_ADDED", name: "Reaction Added" },
      { slug: "SLACK_REACTION_REMOVED", name: "Reaction Removed" },
      { slug: "SLACK_RECEIVE_BOT_MESSAGE", name: "New Bot Message Received" },
      { slug: "SLACK_RECEIVE_MESSAGE", name: "New Message Received" },
    ],
  },
  zendesk: {
    name: "Zendesk",
    events: [
      { slug: "ZENDESK_NEW_USER_TRIGGER", name: "New User Created" },
      { slug: "ZENDESK_NEW_ZENDESK_TICKET_TRIGGER", name: "New Ticket" },
    ],
  },
  stripe: {
    name: "Stripe",
    events: [
      { slug: "STRIPE_CHARGE_FAILED_TRIGGER", name: "Charge Failed" },
      { slug: "STRIPE_CHECKOUT_SESSION_COMPLETED_TRIGGER", name: "Checkout Session Completed" },
      { slug: "STRIPE_INVOICE_PAYMENT_SUCCEEDED_TRIGGER", name: "Invoice Payment Succeeded" },
      { slug: "STRIPE_PAYMENT_FAILED_TRIGGER", name: "Payment Intent Failed" },
      { slug: "STRIPE_PRODUCT_CREATED_TRIGGER", name: "Product Created" },
      { slug: "STRIPE_SUBSCRIPTION_ADDED_TRIGGER", name: "Subscription Added" },
      { slug: "STRIPE_SUBSCRIPTION_DELETED_TRIGGER", name: "Subscription Deleted" },
    ],
  },
  github: {
    name: "GitHub",
    events: [
      { slug: "GITHUB_ARTIFACT_CREATED_TRIGGER", name: "New Workflow Artifact Created" },
      { slug: "GITHUB_BRANCH_CHANGED_TRIGGER", name: "Branch Changed" },
      { slug: "GITHUB_BRANCH_CREATED_TRIGGER", name: "New Branch Created" },
      { slug: "GITHUB_CHECK_RUN_STATUS_CHANGED_TRIGGER", name: "Check Run Status Changed" },
      { slug: "GITHUB_CHECK_SUITE_STATUS_CHANGED_TRIGGER", name: "Check Suite Status Changed" },
      { slug: "GITHUB_CODE_SCANNING_ALERT_CREATED_TRIGGER", name: "New Code Scanning Alert" },
      { slug: "GITHUB_COLLABORATOR_ADDED_TRIGGER", name: "New Collaborator Added" },
      { slug: "GITHUB_COMMIT_EVENT", name: "Commit Event" },
      { slug: "GITHUB_DEPLOYMENT_CREATED_TRIGGER", name: "New Deployment Created" },
      { slug: "GITHUB_DEPLOYMENT_STATE_CHANGED_TRIGGER", name: "Deployment State Changed" },
      { slug: "GITHUB_DEPLOYMENT_STATUS_CREATED", name: "New Deployment Status Created" },
      { slug: "GITHUB_FOLLOWER_EVENT", name: "Follower Changes" },
      { slug: "GITHUB_GIT_REFERENCE_CREATED_TRIGGER", name: "New Git Reference Created" },
      { slug: "GITHUB_ISSUE_ADDED_EVENT", name: "Issue Added" },
      { slug: "GITHUB_ISSUE_ASSIGNED_TO_ME_TRIGGER", name: "Issue Assigned to Me" },
      { slug: "GITHUB_ISSUE_COMMENT_CHANGED_TRIGGER", name: "Issue Comment Changed" },
      { slug: "GITHUB_ISSUE_COMMENT_CREATED_TRIGGER", name: "New Issue Comment" },
      { slug: "GITHUB_ISSUE_CREATED_TRIGGER", name: "New Issue Created" },
      { slug: "GITHUB_ISSUE_EVENT_OCCURRED_TRIGGER", name: "Issue Event Occurred" },
      { slug: "GITHUB_ISSUE_LABEL_CHANGED_TRIGGER", name: "Issue Labels Changed" },
      { slug: "GITHUB_ISSUE_STATE_CHANGED_TRIGGER", name: "Issue State Changed" },
      { slug: "GITHUB_ISSUE_UPDATED_TRIGGER", name: "Issue Updated" },
      { slug: "GITHUB_LABEL_ADDED_EVENT", name: "Label Added" },
      { slug: "GITHUB_NEW_STARGAZER_ADDED_TRIGGER", name: "New Stargazer Added" },
      { slug: "GITHUB_PR_REVIEW_COMMENT_CREATED_TRIGGER", name: "New PR Review Comment" },
      { slug: "GITHUB_PULL_REQUEST_COMMIT_ADDED_TRIGGER", name: "New Commit Added to PR" },
      { slug: "GITHUB_PULL_REQUEST_CREATED", name: "New Pull Request Created" },
      { slug: "GITHUB_PULL_REQUEST_EVENT", name: "Pull Request Event" },
      { slug: "GITHUB_PULL_REQUEST_REVIEWERS_CHANGED_TRIGGER", name: "PR Reviewers Changed" },
      { slug: "GITHUB_PULL_REQUEST_REVIEW_SUBMITTED_TRIGGER", name: "PR Review Submitted" },
      { slug: "GITHUB_PULL_REQUEST_STATE_CHANGED_TRIGGER", name: "PR State Changed" },
      { slug: "GITHUB_PULL_REQUEST_UPDATED", name: "Pull Request Updated" },
      { slug: "GITHUB_README_CHANGED_TRIGGER", name: "README Changed" },
      { slug: "GITHUB_RELEASE_ASSET_ADDED_TRIGGER", name: "New Release Asset Added" },
      { slug: "GITHUB_RELEASE_STATE_CHANGED_TRIGGER", name: "Release State Changed" },
      { slug: "GITHUB_REPOSITORY_CONTENT_CHANGED_TRIGGER", name: "Repository Content Changed" },
      {
        slug: "GITHUB_REPOSITORY_NOTIFICATION_RECEIVED_TRIGGER",
        name: "Repository Notification Received",
      },
      { slug: "GITHUB_REPOSITORY_TAG_CREATED_TRIGGER", name: "New Repository Tag Created" },
      { slug: "GITHUB_SECRET_SCANNING_ALERT_DETECTED_TRIGGER", name: "New Secret Scanning Alert" },
      { slug: "GITHUB_STAR_ADDED_EVENT", name: "Star Added" },
      { slug: "GITHUB_WORKFLOW_ADDED_TRIGGER", name: "New Actions Workflow Added" },
      { slug: "GITHUB_WORKFLOW_JOB_ADDED_TRIGGER", name: "New Workflow Job Added" },
      { slug: "GITHUB_WORKFLOW_JOB_STATE_CHANGED", name: "Workflow Job State Changed" },
      { slug: "GITHUB_WORKFLOW_RUN_ARTIFACT_ADDED", name: "New Artifact Added to Workflow Run" },
      { slug: "GITHUB_WORKFLOW_RUN_CREATED", name: "New Workflow Run Created" },
      { slug: "GITHUB_WORKFLOW_RUN_STATE_CHANGED_TRIGGER", name: "Workflow Run State Changed" },
    ],
  },
  linear: {
    name: "Linear",
    events: [
      { slug: "LINEAR_COMMENT_EVENT_TRIGGER", name: "Comment Received" },
      { slug: "LINEAR_ISSUE_CREATED_TRIGGER", name: "Issue Created" },
      { slug: "LINEAR_ISSUE_UPDATED_TRIGGER", name: "Issue Updated" },
    ],
  },
  salesforce: {
    name: "Salesforce",
    events: [
      { slug: "SALESFORCE_ACCOUNT_CREATED_OR_UPDATED_TRIGGER", name: "Account Created or Updated" },
      { slug: "SALESFORCE_CONTACT_UPDATED_TRIGGER", name: "Contact Updated" },
      {
        slug: "SALESFORCE_GENERIC_S_OBJECT_RECORD_UPDATED_TRIGGER",
        name: "Record Updated (Generic)",
      },
      { slug: "SALESFORCE_NEW_CONTACT_TRIGGER", name: "New Contact" },
      { slug: "SALESFORCE_NEW_LEAD_TRIGGER", name: "New Lead" },
      { slug: "SALESFORCE_NEW_OR_UPDATED_OPPORTUNITY_TRIGGER", name: "New or Updated Opportunity" },
      { slug: "SALESFORCE_TASK_CREATED_OR_COMPLETED_TRIGGER", name: "Task Created or Completed" },
    ],
  },
  jira: {
    name: "Jira",
    events: [
      { slug: "JIRA_NEW_ISSUE_TRIGGER", name: "New Issue" },
      { slug: "JIRA_NEW_PROJECT_TRIGGER", name: "New Project" },
      { slug: "JIRA_UPDATED_ISSUE_TRIGGER", name: "Updated Issue" },
    ],
  },
  googledrive: {
    name: "Google Drive",
    events: [
      { slug: "GOOGLEDRIVE_COMMENT_ADDED_TRIGGER", name: "Comment Added" },
      { slug: "GOOGLEDRIVE_FILE_CREATED_TRIGGER", name: "File Created" },
      { slug: "GOOGLEDRIVE_FILE_DELETED_OR_TRASHED_TRIGGER", name: "File Deleted or Trashed" },
      { slug: "GOOGLEDRIVE_FILE_SHARED_PERMISSIONS_ADDED", name: "File Shared" },
      { slug: "GOOGLEDRIVE_FILE_UPDATED_TRIGGER", name: "File Updated" },
      { slug: "GOOGLEDRIVE_GOOGLE_DRIVE_CHANGES", name: "Drive Changes" },
      { slug: "GOOGLEDRIVE_NEW_FILE_MATCHING_QUERY_TRIGGER", name: "New File Matching Query" },
    ],
  },
  gmail: {
    name: "Gmail",
    events: [
      { slug: "GMAIL_EMAIL_SENT_TRIGGER", name: "Email Sent" },
      { slug: "GMAIL_NEW_GMAIL_MESSAGE", name: "New Message Received" },
    ],
  },
};

export const PALETTE_ENTRIES: readonly PaletteEntry[] = [
  {
    kind: "trigger.manual",
    label: "Manual trigger",
    category: "Triggers",
    description: "Run on demand from the editor or a button.",
  },
  {
    kind: "trigger.cron",
    label: "Schedule",
    category: "Triggers",
    description: "Run on a recurring cron schedule.",
  },
  {
    kind: "trigger.webhook",
    label: "Webhook",
    category: "Triggers",
    description: "Run when an HTTP request hits a tenant URL.",
  },
  {
    kind: "trigger.app_event",
    label: "App event",
    category: "Triggers",
    description: "Run when a connected app fires an event (Notion, Slack, GitHub, …).",
  },
  {
    kind: "trigger.inbound_call",
    label: "Inbound call",
    category: "Triggers",
    description: "Run when an inbound phone call arrives on a connected number.",
  },
  {
    kind: "core.http_request",
    label: "HTTP request",
    category: "Core",
    description: "Call an external HTTP endpoint.",
  },
  {
    kind: "core.code",
    label: "Code",
    category: "Core",
    description: "Run a TypeScript snippet in a sandbox.",
  },
  {
    kind: "core.tool_call",
    label: "Tool call",
    category: "Core",
    description: "Invoke a tool exposed by an MCP server.",
  },
  {
    kind: "ai.agent",
    label: "AI agent",
    category: "AI:Agents",
    description: "LLM agent — connects to model, memory, tools, and retriever slots.",
  },
  {
    kind: "ai.voice_agent",
    label: "Voice agent",
    category: "AI:Agents",
    description: "Phone / voice agent — all agent slots plus a voice slot for VAPI telephony.",
  },
  {
    kind: "ai.language_model",
    label: "Language model",
    category: "AI:Subcomponents",
    description: "Configure a model for an agent slot.",
  },
  {
    kind: "ai.memory",
    label: "Memory",
    category: "AI:Subcomponents",
    description: "Give an agent conversational memory.",
  },
  {
    kind: "ai.retriever",
    label: "Knowledge base retriever",
    category: "AI:Subcomponents",
    description: "Wire a KB into an agent&apos;s retriever slot for RAG.",
  },
  {
    kind: "ai.output_parser",
    label: "Output parser",
    category: "AI:Subcomponents",
    description: "Parse and validate an agent&apos;s raw output.",
  },
  {
    kind: "flow.if",
    label: "If",
    category: "Flow",
    description: "Branch on a condition.",
  },
  {
    kind: "flow.switch",
    label: "Switch",
    category: "Flow",
    description: "Route to one of several outputs.",
  },
  {
    kind: "flow.loop",
    label: "Loop",
    category: "Flow",
    description: "Iterate over a list.",
  },
  {
    kind: "flow.merge",
    label: "Merge",
    category: "Flow",
    description: "Combine branches back together.",
  },
  {
    kind: "flow.wait",
    label: "Wait",
    category: "Flow",
    description: "Pause for a duration or until a signal.",
  },
  {
    kind: "flow.noop",
    label: "No-op",
    category: "Flow",
    description: "Pass-through placeholder.",
  },
  {
    kind: "transform",
    label: "Transform",
    category: "Transform",
    description: "Reshape data between steps.",
  },
  {
    kind: "human.review",
    label: "Human review",
    category: "Core",
    description: "Pause and request approval before a sensitive step.",
  },
  {
    kind: "editor.sticky_note",
    label: "Sticky note",
    category: "Editor",
    description: "Add a freeform text annotation to the canvas.",
  },
];

interface DefaultNodeArgs {
  readonly kind: string;
  readonly id: string;
  readonly position: { readonly x: number; readonly y: number };
}

// Returns a minimum-valid node for the given kind. Returns null for kinds
// the catalog doesn't cover yet; callers should treat that as "not in the palette."
export function defaultNodeForKind(args: DefaultNodeArgs): WorkflowNodeInput | null {
  const base = { id: args.id, type: args.kind, position: args.position };
  switch (args.kind) {
    case "trigger.manual":
      return { ...base, params: {} };
    case "trigger.cron":
      return { ...base, params: { expression: "0 9 * * *", timezone: "UTC" } };
    case "trigger.webhook":
      return {
        ...base,
        params: {
          method: "POST",
          verifySignature: false,
          responseMode: "on_received",
          endpointSlug: `webhook-${args.id.slice(0, 6)}`,
        },
      };
    case "trigger.app_event": {
      const firstApp = APP_EVENT_CATALOG.github;
      const firstEvent = firstApp.events[0];
      return {
        ...base,
        params: {
          appSlug: "github",
          eventSlug: firstEvent?.slug ?? "",
          filters: {},
          webhookId: `app-event-${args.id.slice(0, 6)}`,
        },
      };
    }
    case "trigger.inbound_call":
      return { ...base, params: { phoneNumberId: null } };
    case "core.http_request":
      return {
        ...base,
        params: {
          method: "GET",
          url: "https://example.com",
          headers: {},
          query: {},
          body: null,
        },
      };
    case "core.code":
      return {
        ...base,
        params: {
          language: "typescript",
          source: "return { message: 'hello' };",
          timeoutSec: 10,
          memoryMb: 128,
        },
      };
    case "core.tool_call":
      return {
        ...base,
        params: { mcpServerId: "mcp_placeholder", toolName: "tool", parameters: {} },
      };
    case "ai.agent":
      return {
        ...base,
        params: {
          systemPrompt: "You are a helpful assistant.",
          userPromptTemplate: "{{ $json.text }}",
          maxIterations: 5,
          outputMode: "text",
        },
      };
    case "ai.language_model":
      return {
        ...base,
        params: {
          provider: "anthropic",
          model: "claude-haiku-4-5",
          temperature: 0.7,
          maxTokens: 1024,
        },
      };
    case "ai.memory":
      return {
        ...base,
        params: { strategy: "buffer_window", contextWindowLength: 5, sessionKeyExpression: null },
      };
    case "flow.if":
      return {
        ...base,
        params: {
          conditions: [
            {
              id: `cond_${args.id.slice(0, 6)}`,
              leftValue: "{{ $json.x }}",
              operator: "equals",
              rightValue: true,
            },
          ],
          combinator: "and",
        },
      };
    case "flow.switch":
      return {
        ...base,
        params: {
          mode: "expression",
          cases: [{ when: "{{ $json.x === 'a' }}", outputIndex: 0 }],
          defaultOutputIndex: 1,
        },
      };
    case "flow.loop":
      return {
        ...base,
        params: { mode: "for_each", iterableExpression: "{{ $json.items }}", batchSize: 1 },
      };
    case "flow.merge":
      return { ...base, params: { strategy: "append", keyExpression: null } };
    case "flow.wait":
      return { ...base, params: { until: { mode: "duration", ms: 5000 } } };
    case "flow.noop":
      return { ...base, params: {} };
    case "transform":
      return { ...base, params: { op: "edit_fields", config: {} } };
    case "ai.voice_agent":
      return {
        ...base,
        params: {
          direction: "inbound",
          firstMessage: "Hello, how can I help you today?",
          endCallPhrases: ["goodbye", "bye"],
          maxDurationSec: 300,
          silenceTimeoutSec: 30,
          interruptionEnabled: true,
          recordingEnabled: false,
          voiceEntry: {
            provider: "elevenlabs",
            voiceId: "21m00Tcm4TlvDq8ikWAM",
            model: "eleven_turbo_v2_5",
            voiceMode: "conversational",
          },
          modelConnection: {
            provider: "anthropic",
            model: "claude-haiku-4-5",
            systemPrompt: "You are a helpful voice assistant.",
          },
          toolsEndpoint: {
            tools: [],
            serverUrl: "https://placeholder.mirrorverse.io/api/voice/webhook",
          },
          knowledgeBaseIds: [],
        },
      };
    case "ai.retriever":
      return { ...base, params: { knowledgeBaseId: "", topK: 6, minScore: null } };
    case "ai.output_parser":
      return { ...base, params: { strategy: "auto_fix", schema: null, autoFix: true } };
    case "human.review":
      return {
        ...base,
        params: {
          channel: { kind: "chat" },
          promptTemplate: "Please review and approve to continue.",
          responseSchema: null,
          timeoutSec: 3600,
          onTimeout: "abort",
          defaultValue: null,
        },
      };
    case "editor.sticky_note":
      return { ...base, params: { content: "", width: 200, height: 120, color: 0 } };
    default:
      return null;
  }
}
