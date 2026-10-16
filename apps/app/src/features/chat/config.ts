export type ModelOption = {
  readonly id: string;
  readonly name: string;
  readonly chef: string;
  readonly chefSlug: string;
  readonly description: string;
  readonly series?: string;
  readonly pro?: boolean;
};

export const CHAT_MODELS = [
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    chef: "Anthropic",
    chefSlug: "anthropic",
    description: "Fastest and cheapest Claude for high-volume tool executions",
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    chef: "Anthropic",
    chefSlug: "anthropic",
    description: "Balanced reasoning with reliable multi-step tool use",
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    chef: "Anthropic",
    chefSlug: "anthropic",
    description: "Powerful agentic model for demanding workflows",
    pro: true,
  },
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    chef: "Anthropic",
    chefSlug: "anthropic",
    description: "Latest Opus for deep reasoning and complex automation",
    pro: true,
  },
  {
    id: "claude-fable-5-1",
    name: "Claude Fable 5.1",
    chef: "Anthropic",
    chefSlug: "anthropic",
    description: "Most capable Claude for the hardest agentic work",
    pro: true,
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 nano",
    chef: "OpenAI",
    chefSlug: "openai",
    description: "Cheapest tier for short, low-stakes turns",
  },
  {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    chef: "OpenAI",
    chefSlug: "openai",
    description: "Low-cost GPT-6 with solid tool-use reliability",
  },
  {
    id: "gpt-6-sol",
    name: "GPT-6 Sol",
    chef: "OpenAI",
    chefSlug: "openai",
    description: "Balanced GPT-6 for everyday reasoning and planning",
    pro: true,
  },
  {
    id: "gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    chef: "OpenAI",
    chefSlug: "openai",
    description: "Updated GPT-6 Sol with stronger agentic performance",
    pro: true,
  },
  {
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    chef: "OpenAI",
    chefSlug: "openai",
    description: "Flagship GPT-6 for the hardest reasoning and planning",
    pro: true,
  },
] as const satisfies readonly ModelOption[];

// Cheapest model in the picker. ~$0.05 / 1M input, ~$0.40 / 1M output —
// roughly 20× cheaper than Haiku for the same orchestration role.
export const DEFAULT_CHAT_MODEL: ModelOption["id"] = "gpt-5-nano";

export type ChatStarter = {
  readonly title: string;
  readonly prompt: string;
};

export const CHAT_STARTERS = [
  {
    title: "Lead Qualification Agent",
    prompt:
      "Qualifies inbound leads from any channel, asks discovery questions, books meetings via Calendly, and updates Salesforce automatically.",
  },
  {
    title: "Expense Approval bots",
    prompt:
      "Processes employee expense requests, verifies receipts, checks policy limits, approves small amounts or escalates to finance.",
  },
  {
    title: "HR assistant",
    prompt:
      "Guides new hires through paperwork, benefits questions, and team intros while creating tasks in Asana and notifying HR.",
  },
] as const satisfies readonly ChatStarter[];

export type WorkflowKind = "automation" | "voice-agent" | "chat-agent" | "code";

export const WORKFLOW_KIND_LABEL: Record<WorkflowKind, string> = {
  automation: "Automation",
  "voice-agent": "Voice agent",
  "chat-agent": "Chat agent",
  code: "Code",
};

export type AutomationApp = {
  readonly name: string;
  readonly domain: string;
  readonly logoUrl?: string;
};

export type UseCaseAutomation = {
  readonly title: string;
  readonly prompt: string;
  readonly apps: readonly AutomationApp[];
};

export type UseCaseCategory = {
  readonly label: string;
  readonly value: string;
  readonly automations: readonly UseCaseAutomation[];
};

export const USE_CASE_CATEGORIES: readonly UseCaseCategory[] = [
  {
    label: "Customer Support",
    value: "customer-support",
    automations: [
      {
        title: "Ticket Auto-Triage",
        prompt:
          "Classifies incoming support tickets by urgency, routes them to the right queue in Zendesk, and sends agents context via Slack.",
        apps: [
          { name: "Zendesk", domain: "zendesk.com" },
          { name: "Intercom", domain: "intercom.com" },
          { name: "Slack", domain: "slack.com" },
        ],
      },
      {
        title: "FAQ Deflection",
        prompt:
          "Intercepts common support questions using your Notion knowledge base and deflects them before a Zendesk ticket is ever created.",
        apps: [
          { name: "Notion", domain: "notion.so" },
          { name: "Zendesk", domain: "zendesk.com" },
          { name: "Intercom", domain: "intercom.com" },
        ],
      },
      {
        title: "Returns Processing",
        prompt:
          "Validates customer return requests against Shopify order history, approves eligible ones, and issues Stripe refunds automatically.",
        apps: [
          { name: "Shopify", domain: "shopify.com" },
          { name: "Stripe", domain: "stripe.com" },
          { name: "Zendesk", domain: "zendesk.com" },
        ],
      },
      {
        title: "Smart Escalation",
        prompt:
          "Detects when a support conversation needs a human, creates a summarized handoff in Zendesk, and alerts the right agent in Slack.",
        apps: [
          { name: "Zendesk", domain: "zendesk.com" },
          { name: "Salesforce", domain: "salesforce.com" },
          { name: "Slack", domain: "slack.com" },
        ],
      },
      {
        title: "CSAT Collection",
        prompt:
          "Sends a short Typeform satisfaction survey after every resolved Zendesk ticket and surfaces low scores to the support team in Slack.",
        apps: [
          { name: "Typeform", domain: "typeform.com" },
          { name: "Zendesk", domain: "zendesk.com" },
          { name: "Slack", domain: "slack.com" },
        ],
      },
      {
        title: "Live Chat Handoff",
        prompt:
          "Manages live chat triage in Intercom, hands off complex conversations to human agents with full context, and logs outcomes to HubSpot.",
        apps: [
          { name: "Intercom", domain: "intercom.com" },
          { name: "HubSpot", domain: "hubspot.com" },
          { name: "Slack", domain: "slack.com" },
        ],
      },
    ],
  },
  {
    label: "Sales",
    value: "sales",
    automations: [
      {
        title: "Lead Qualification",
        prompt:
          "Qualifies inbound leads conversationally, scores their fit and intent, and enriches HubSpot and Salesforce with the results automatically.",
        apps: [
          { name: "HubSpot", domain: "hubspot.com" },
          { name: "Salesforce", domain: "salesforce.com" },
          { name: "Apollo", domain: "apollo.io" },
        ],
      },
      {
        title: "Meeting Scheduling",
        prompt:
          "Sends qualified leads a Calendly booking link, confirms the meeting in Google Calendar, and updates the deal stage in HubSpot.",
        apps: [
          { name: "Calendly", domain: "calendly.com" },
          {
            name: "Google Calendar",
            domain: "calendar.google.com",
            logoUrl: "https://www.google.com/s2/favicons?sz=128&domain=calendar.google.com",
          },
          { name: "HubSpot", domain: "hubspot.com" },
        ],
      },
      {
        title: "Follow-up Sequences",
        prompt:
          "Drafts and sends personalized follow-up emails via HubSpot based on each lead's stage, pausing automatically when a reply is detected.",
        apps: [
          { name: "HubSpot", domain: "hubspot.com" },
          { name: "Gmail", domain: "gmail.com" },
          { name: "Salesforce", domain: "salesforce.com" },
        ],
      },
      {
        title: "CRM Auto-Update",
        prompt:
          "Logs every call, email, and meeting to Salesforce and HubSpot with enriched deal stage, notes, and next steps — no manual entry required.",
        apps: [
          { name: "Salesforce", domain: "salesforce.com" },
          { name: "HubSpot", domain: "hubspot.com" },
          { name: "Apollo", domain: "apollo.io" },
        ],
      },
      {
        title: "Proposal Generation",
        prompt:
          "Assembles a tailored proposal in Notion based on a qualified lead's answers and sends a Slack alert to the rep for one-click review.",
        apps: [
          { name: "HubSpot", domain: "hubspot.com" },
          { name: "Notion", domain: "notion.so" },
          { name: "Slack", domain: "slack.com" },
        ],
      },
      {
        title: "Deal Alerts",
        prompt:
          "Monitors Salesforce for stalled deals and notifies reps via Slack with context and suggested next actions before opportunities go cold.",
        apps: [
          { name: "Salesforce", domain: "salesforce.com" },
          { name: "Slack", domain: "slack.com" },
          { name: "Gmail", domain: "gmail.com" },
        ],
      },
    ],
  },
  {
    label: "HR & Onboarding",
    value: "hr-onboarding",
    automations: [
      {
        title: "Offer Letter Delivery",
        prompt:
          "Generates an offer letter and sends it for e-signature via DocuSign as soon as a candidate is marked hired in BambooHR.",
        apps: [
          { name: "DocuSign", domain: "docusign.com" },
          { name: "BambooHR", domain: "bamboohr.com" },
          { name: "Gmail", domain: "gmail.com" },
        ],
      },
      {
        title: "Welcome Workflow",
        prompt:
          "Sends a new hire a Slack welcome message with their first-week agenda and automatically opens IT provisioning tickets in Jira.",
        apps: [
          { name: "Slack", domain: "slack.com" },
          { name: "BambooHR", domain: "bamboohr.com" },
          { name: "Jira", domain: "atlassian.com" },
        ],
      },
      {
        title: "Policy Q&A Bot",
        prompt:
          "Answers new hire policy questions 24/7 from your Notion knowledge base and flags unanswered questions for HR follow-up via Slack.",
        apps: [
          { name: "Notion", domain: "notion.so" },
          { name: "Slack", domain: "slack.com" },
          { name: "BambooHR", domain: "bamboohr.com" },
        ],
      },
      {
        title: "IT Provisioning",
        prompt:
          "Automatically requests tool access in Okta for every app in a new hire's role profile and confirms credentials are ready before day one.",
        apps: [
          { name: "Okta", domain: "okta.com" },
          { name: "Jira", domain: "atlassian.com" },
          { name: "Slack", domain: "slack.com" },
        ],
      },
      {
        title: "30-60-90 Check-in",
        prompt:
          "Sends automated Typeform check-ins at 30, 60, and 90 days and surfaces sentiment flags to HR leaders in BambooHR.",
        apps: [
          { name: "Typeform", domain: "typeform.com" },
          { name: "BambooHR", domain: "bamboohr.com" },
          { name: "Slack", domain: "slack.com" },
        ],
      },
      {
        title: "Benefits Enrollment",
        prompt:
          "Guides employees through benefits selections step by step in Rippling and follows up with incomplete enrollments before the deadline.",
        apps: [
          { name: "Rippling", domain: "rippling.com" },
          { name: "BambooHR", domain: "bamboohr.com" },
          { name: "Gmail", domain: "gmail.com" },
        ],
      },
    ],
  },
  {
    label: "Finance",
    value: "finance-operations",
    automations: [
      {
        title: "Invoice Processing",
        prompt:
          "Parses incoming invoices, matches them against POs in QuickBooks, and routes them for approval with all supporting context attached.",
        apps: [
          { name: "QuickBooks", domain: "quickbooks.com" },
          { name: "Stripe", domain: "stripe.com" },
          { name: "Gmail", domain: "gmail.com" },
        ],
      },
      {
        title: "Expense Approval",
        prompt:
          "Validates expense reports in Expensify against your policy, routes them to the right approver in Slack, and syncs approvals to QuickBooks.",
        apps: [
          { name: "Expensify", domain: "expensify.com" },
          { name: "Slack", domain: "slack.com" },
          { name: "QuickBooks", domain: "quickbooks.com" },
        ],
      },
      {
        title: "Payment Reminders",
        prompt:
          "Sends escalating overdue invoice reminders via Stripe and Gmail, and syncs confirmed payments back to QuickBooks automatically.",
        apps: [
          { name: "Stripe", domain: "stripe.com" },
          { name: "Gmail", domain: "gmail.com" },
          { name: "QuickBooks", domain: "quickbooks.com" },
        ],
      },
      {
        title: "Budget Alerts",
        prompt:
          "Monitors departmental spend in QuickBooks and notifies the right owners in Slack when they approach or exceed their budget threshold.",
        apps: [
          { name: "QuickBooks", domain: "quickbooks.com" },
          { name: "Slack", domain: "slack.com" },
          {
            name: "Google Sheets",
            domain: "sheets.google.com",
            logoUrl: "https://www.google.com/s2/favicons?sz=128&domain=sheets.google.com",
          },
        ],
      },
      {
        title: "Month-end Reports",
        prompt:
          "Generates a formatted financial summary in Google Sheets at period close and distributes it to stakeholders via Slack automatically.",
        apps: [
          { name: "QuickBooks", domain: "quickbooks.com" },
          {
            name: "Google Sheets",
            domain: "sheets.google.com",
            logoUrl: "https://www.google.com/s2/favicons?sz=128&domain=sheets.google.com",
          },
          { name: "Slack", domain: "slack.com" },
        ],
      },
      {
        title: "Vendor Onboarding",
        prompt:
          "Sends new vendors a guided DocuSign intake form for tax info and banking details, then syncs all data to QuickBooks automatically.",
        apps: [
          { name: "DocuSign", domain: "docusign.com" },
          { name: "QuickBooks", domain: "quickbooks.com" },
          { name: "Gmail", domain: "gmail.com" },
        ],
      },
    ],
  },
  {
    label: "E-commerce",
    value: "e-commerce",
    automations: [
      {
        title: "Cart Recovery",
        prompt:
          "Reaches out to shoppers who abandon a cart via SMS and email using Klaviyo and Twilio, with a personalized incentive if they don't return.",
        apps: [
          { name: "Shopify", domain: "shopify.com" },
          { name: "Klaviyo", domain: "klaviyo.com" },
          { name: "Twilio", domain: "twilio.com" },
        ],
      },
      {
        title: "Order Tracking",
        prompt:
          "Sends proactive Shopify shipping updates to customers via Twilio and Gmail, and flags delays with an automatic apology and recovery options.",
        apps: [
          { name: "Shopify", domain: "shopify.com" },
          { name: "Twilio", domain: "twilio.com" },
          { name: "Gmail", domain: "gmail.com" },
        ],
      },
      {
        title: "Returns Processing",
        prompt:
          "Evaluates Shopify return requests against your policy, approves eligible ones instantly, and issues Stripe refunds with prepaid labels.",
        apps: [
          { name: "Shopify", domain: "shopify.com" },
          { name: "Stripe", domain: "stripe.com" },
          { name: "Zendesk", domain: "zendesk.com" },
        ],
      },
      {
        title: "Product Q&A",
        prompt:
          "Answers shopper product questions via Intercom using your Shopify catalog and logs unanswered queries as content gaps in Notion.",
        apps: [
          { name: "Shopify", domain: "shopify.com" },
          { name: "Intercom", domain: "intercom.com" },
          { name: "Notion", domain: "notion.so" },
        ],
      },
      {
        title: "Review Requests",
        prompt:
          "Sends a Klaviyo review request after delivery, routes negative feedback to Zendesk before it goes public, and thanks happy customers.",
        apps: [
          { name: "Shopify", domain: "shopify.com" },
          { name: "Klaviyo", domain: "klaviyo.com" },
          { name: "Trustpilot", domain: "trustpilot.com" },
        ],
      },
      {
        title: "Loyalty Rewards",
        prompt:
          "Awards Klaviyo points at purchase milestones, notifies customers when they unlock new tiers, and sends Twilio reminders before rewards expire.",
        apps: [
          { name: "Shopify", domain: "shopify.com" },
          { name: "Klaviyo", domain: "klaviyo.com" },
          { name: "Twilio", domain: "twilio.com" },
        ],
      },
    ],
  },
  {
    label: "Healthcare",
    value: "healthcare",
    automations: [
      {
        title: "Appointment Booking",
        prompt:
          "Lets patients book, reschedule, or cancel appointments 24/7 via Twilio SMS, syncing availability in real time with Google Calendar.",
        apps: [
          {
            name: "Google Calendar",
            domain: "calendar.google.com",
            logoUrl: "https://www.google.com/s2/favicons?sz=128&domain=calendar.google.com",
          },
          { name: "Twilio", domain: "twilio.com" },
          { name: "Athenahealth", domain: "athenahealth.com" },
        ],
      },
      {
        title: "No-show Prevention",
        prompt:
          "Sends layered reminders at 48h, 24h, and 2h before appointments via Twilio and Gmail, with prep instructions and a one-tap confirm or reschedule link.",
        apps: [
          { name: "Twilio", domain: "twilio.com" },
          { name: "Gmail", domain: "gmail.com" },
          {
            name: "Google Calendar",
            domain: "calendar.google.com",
            logoUrl: "https://www.google.com/s2/favicons?sz=128&domain=calendar.google.com",
          },
        ],
      },
      {
        title: "Eligibility Checks",
        prompt:
          "Verifies insurance coverage before appointments via Athenahealth and informs patients of any co-pays or coverage gaps via Twilio in advance.",
        apps: [
          { name: "Stripe", domain: "stripe.com" },
          { name: "Twilio", domain: "twilio.com" },
          { name: "Athenahealth", domain: "athenahealth.com" },
        ],
      },
      {
        title: "Care Plan Follow-up",
        prompt:
          "Checks in on patients after visits via Twilio to assess medication adherence and flags concerns to the care team in Slack immediately.",
        apps: [
          { name: "Twilio", domain: "twilio.com" },
          { name: "Slack", domain: "slack.com" },
          { name: "Athenahealth", domain: "athenahealth.com" },
        ],
      },
      {
        title: "Prescription Refills",
        prompt:
          "Lets patients request refills via Twilio SMS, verifies eligibility in Athenahealth, and routes the request to the prescribing provider via Gmail.",
        apps: [
          { name: "Twilio", domain: "twilio.com" },
          { name: "Gmail", domain: "gmail.com" },
          { name: "Athenahealth", domain: "athenahealth.com" },
        ],
      },
      {
        title: "Patient Intake",
        prompt:
          "Walks new patients through digital intake forms via Typeform before their first visit and syncs completed data directly to Athenahealth.",
        apps: [
          { name: "Typeform", domain: "typeform.com" },
          { name: "Athenahealth", domain: "athenahealth.com" },
          { name: "DocuSign", domain: "docusign.com" },
        ],
      },
    ],
  },
];
