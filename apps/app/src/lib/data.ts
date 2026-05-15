import {
  appStructure,
  Integration,
  IntegrationCategory,
  OrganizationProps,
  PhoneNumber,
  EmailChannel,
  WhatsAppChannel,
  CallLog,
  Transcript,
  Agent,
  AgentTemplate,
  AgentTemplateCategory,
} from "./types";
import {
  SiNotion,
  SiGoogle,
  SiIntercom,
  SiZendesk,
  SiSlack,
  SiMessenger,
  SiWhatsapp,
  SiTelegram,
  SiGoogledocs,
  SiGooglesheets,
  SiCalendly,
} from "react-icons/si";
import { MdOutlineLocalPhone, MdOutlineEmail } from "react-icons/md";
import { Megaphone, Shapes, Workflow as WorkflowIcon } from "lucide-react";

export const industries = [
  {
    value: "ecommerce",
    label: "E-commerce & Retail",
    description:
      "Automate order status, returns, customer support, inventory alerts, and personalized follow-ups across WhatsApp, SMS, email and voice — reducing support tickets and increasing repeat purchases.",
  },
  {
    value: "healthcare",
    label: "Healthcare & Telemedicine",
    description:
      "Handle appointment booking, patient reminders, post-visit follow-ups, prescription refills, and triage via voice/WhatsApp — improving patient satisfaction and reducing no-shows.",
  },
  {
    value: "fintech",
    label: "FinTech & Banking",
    description:
      "Securely automate KYC, transaction alerts, fraud checks, payment reminders, and support queries with full audit logging and compliance guardrails.",
  },
  {
    value: "edtech",
    label: "EdTech & Online Education",
    description:
      "Automate student enrollment, course reminders, assignment follow-ups, doubt resolution, and payment nudges — boosting completion rates and reducing admin workload.",
  },
  {
    value: "logistics",
    label: "Logistics & Supply Chain",
    description:
      "Track shipments in real-time, notify customers/suppliers about delays, automate proof-of-delivery, and coordinate warehouse ops — cutting delays and improving transparency.",
  },
  {
    value: "real-estate",
    label: "Real Estate & Property Management",
    description:
      "Automate property inquiries, viewing scheduling, lead qualification, contract reminders, and tenant support across channels — shortening sales cycles and improving tenant satisfaction.",
  },
  {
    value: "hospitality",
    label: "Hospitality & Travel",
    description:
      "Manage bookings, send check-in reminders, handle guest requests, process feedback, and upsell services via WhatsApp/voice — increasing guest loyalty and revenue.",
  },
  {
    value: "professional-services",
    label: "Professional Services (Consulting, Legal, Agencies)",
    description:
      "Automate client onboarding, proposal follow-ups, meeting scheduling, invoice reminders, and support queries — freeing consultants for high-value work.",
  },
  {
    value: "hr-tech",
    label: "HR Tech & Recruitment",
    description:
      "Streamline candidate screening, interview scheduling, onboarding, leave requests, and employee queries with secure, compliant automation.",
  },
  {
    value: "manufacturing",
    label: "Manufacturing & Industrial",
    description:
      "Monitor production alerts, automate supplier reordering, track quality control issues, and manage maintenance requests — reducing downtime and improving efficiency.",
  },
];

export const appsList: appStructure[] = [
  {
    name: "Notion",
    description: "Notion is a productivity app",
    url: "https://notion.so",
    icon: SiNotion,
  },
  {
    name: "Google Workspace",
    description: "Google Workspace is a productivity app",
    url: "https://workspace.google.com",
    icon: SiGoogle,
  },
  {
    name: "Intercom",
    description: "Intercom is a productivity app",
    url: "https://intercom.com",
    icon: SiIntercom,
  },
  {
    name: "Zendesk",
    description: "Zendesk is a productivity app",
    url: "https://zendesk.com",
    icon: SiZendesk,
  },
  {
    name: "Slack",
    description: "Slack is a productivity app",
    url: "https://slack.com",
    icon: SiSlack,
  },
  {
    name: "Messenger",
    description: "Messenger is a productivity app",
    url: "https://messenger.com",
    icon: SiMessenger,
  },
  {
    name: "Whatsapp",
    description: "Whatsapp is a productivity app",
    url: "https://whatsapp.com",
    icon: SiWhatsapp,
  },
  {
    name: "Telegram",
    description: "Telegram is a productivity app",
    url: "https://telegram.com",
    icon: SiTelegram,
  },
  {
    name: "Google Docs",
    description: "Google Docs is a productivity app",
    url: "https://docs.google.com",
    icon: SiGoogledocs,
  },
  {
    name: "Google Sheets",
    description: "Google Sheets is a productivity app",
    url: "https://sheets.google.com",
    icon: SiGooglesheets,
  },
  {
    name: "Calendly",
    description: "Calendly is a productivity app",
    url: "https://calendly.com",
    icon: SiCalendly,
  },
];

export const deployList: appStructure[] = [
  {
    name: "Zendesk",
    description: "Zendesk is a productivity app",
    url: "https://zendesk.com",
    icon: SiZendesk,
  },
  {
    name: "Slack",
    description: "Slack is a productivity app",
    url: "https://slack.com",
    icon: SiSlack,
  },
  {
    name: "Messenger",
    description: "Messenger is a productivity app",
    url: "https://messenger.com",
    icon: SiMessenger,
  },
  {
    name: "Whatsapp",
    description: "Whatsapp is a productivity app",
    url: "https://whatsapp.com",
    icon: SiWhatsapp,
  },
  {
    name: "Telegram",
    description: "Telegram is a productivity app",
    url: "https://telegram.com",
    icon: SiTelegram,
  },
  {
    name: "Phone",
    description: "Phone is a productivity app",
    url: "https://phone.com",
    icon: MdOutlineLocalPhone,
  },
  {
    name: "Email",
    description: "Email is a productivity app",
    url: "https://email.com",
    icon: MdOutlineEmail,
  },
];

export interface Team {
  id: string;
  name: string;
  initials: string;
  orgName: string;
}

export const orgSample: OrganizationProps[] = [
  {
    OrganizationLogo: "https://github.com/shadcn.png",
    organizationName: "Mel's Place",
    team: "Marketing team",
    userRole: "admin",
    orgAction: () => {},
  },
  {
    OrganizationLogo: "https://github.com/shadcn.png",
    organizationName: "Acme Corp",
    team: "Customer support",
    userRole: "member",
    orgAction: () => {},
  },
];

export const teamsData: Team[] = [
  {
    id: "marketing",
    name: "Marketting team",
    initials: "MG",
    orgName: "Mirrorverse",
  },
  {
    id: "customer-support",
    name: "Customer support",
    initials: "CS",
    orgName: "Mirrorverse",
  },
  { id: "sales", name: "Sales", initials: "SS", orgName: "Mirrorverse" },
];

export interface SidebarSubItem {
  name: string;
  url: string;
}

export interface SidebarAction {
  name: string;
  url: string;
  icon: React.ElementType;
  type?: "creative" | "collapsible";
  sub?: SidebarSubItem[];
}

export interface SidebarGroup {
  name: string;
  actions: SidebarAction[];
}
export const sidebarData: SidebarGroup[] = [
  {
    name: "Create",
    actions: [
      {
        name: "Workflows",
        url: "/workflows",
        icon: WorkflowIcon,
        type: "creative",
      },
    ],
  },
  {
    name: "Deploy",
    actions: [
      {
        name: "Channels",
        url: "/deploy/phone",
        icon: Megaphone,
        type: "collapsible",
        sub: [
          { name: "Phone", url: "/deploy/phone" },
          { name: "WhatsApp", url: "/deploy/whatsapp" },
        ],
      },
      {
        name: "Integrations",
        url: "/integrations",
        icon: Shapes,
      },
    ],
  },
];

import { SiStripe, SiSalesforce, SiGoogleanalytics, SiHubspot } from "react-icons/si";
import { LuCalendar } from "react-icons/lu";

export const CATEGORIES: IntegrationCategory[] = [
  "All",
  "CRM",
  "Customer support",
  "Marketing",
  "Collaboration",
  "Ecommerce",
  "Scheduling",
  "Productivity",
  "Messaging",
  "File storage",
];

export const INTEGRATIONS: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description:
      "Team messaging app for real-time chat, channels, and integrations to streamline internal communication.",
    icon: SiSlack,
    iconColor: "text-[#4A154B]",
    category: ["Collaboration", "Messaging"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "All-in-one workspace for notes, databases, wikis, and project documentation.",
    icon: SiNotion,
    iconColor: "text-foreground",
    category: ["Productivity", "Collaboration"],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description:
      "Comprehensive CRM for tracking sales pipelines, customer data, and automating revenue processes.",
    icon: SiSalesforce,
    iconColor: "text-[#00A1E0]",
    category: ["CRM", "Marketing", "Ecommerce"],
  },
  {
    id: "zendesk",
    name: "Zendesk",
    description:
      "Full-service customer support suite for ticketing, knowledge bases, and multi-channel helpdesk.",
    icon: SiZendesk,
    iconColor: "text-[#03363D]",
    category: ["Customer support", "Collaboration", "Messaging"],
  },
  {
    id: "cal",
    name: "Cal",
    description:
      "Simple calendar booking link tool for sharing availability and scheduling appointments.",
    icon: LuCalendar,
    iconColor: "text-foreground",
    category: ["Scheduling", "Productivity"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description:
      "Payment processing platform for accepting online payments, subscriptions, and payouts.",
    icon: SiStripe,
    iconColor: "text-[#635BFF]",
    category: ["Ecommerce"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description:
      "Popular messaging app for business-customer text, voice, and media communication.",
    icon: SiWhatsapp,
    iconColor: "text-[#25D366]",
    category: ["Messaging"],
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description:
      "Web analytics service for tracking website traffic, user behavior, and marketing campaign performance.",
    icon: SiGoogleanalytics,
    iconColor: "text-[#E37400]",
    category: ["Marketing"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description:
      "All-in-one inbound marketing, sales, and CRM platform for managing customer relationships.",
    icon: SiHubspot,
    iconColor: "text-[#FF7A59]",
    category: ["CRM", "Marketing"],
  },
  {
    id: "intercom",
    name: "Intercom",
    description:
      "Customer messaging platform for live chat, targeted messages, and support automation.",
    icon: SiIntercom,
    iconColor: "text-[#1F8DED]",
    category: ["Customer support", "Messaging"],
  },
  {
    id: "calendly",
    name: "Calendly",
    description: "Automated scheduling tool for booking meetings without back-and-forth emails.",
    icon: SiCalendly,
    iconColor: "text-[#006BFF]",
    category: ["Scheduling", "Productivity"],
  },
];

export const MOCK_PHONE_NUMBERS: PhoneNumber[] = [
  {
    id: "1",
    number: "+1 (555) 123-4567",
    provider: "twilio",
    status: "active",
    description: "Main support line",
    callType: "Inbound",
    purpose: "Agent",
    verificationStatus: "verified",
    assignedAgent: "Support Agent",
    createdAt: new Date("2024-11-01"),
  },
  {
    id: "2",
    number: "+1 (555) 987-6543",
    provider: "twilio",
    status: "active",
    description: "Sales outreach",
    callType: "Outbound",
    purpose: "Agent call",
    verificationStatus: "pending",
    createdAt: new Date("2024-11-01"),
  },
  {
    id: "3",
    number: "+44 20 1234 5678",
    provider: "twilio",
    status: "active",
    description: "UK Customer service",
    callType: "All",
    purpose: "Human handoff",
    verificationStatus: "verified",
    assignedAgent: "Support Agent",
    createdAt: new Date("2024-11-01"),
  },
];

export const MOCK_EMAIL_CHANNELS: EmailChannel[] = [
  {
    id: "1",
    address: "support@mel.co",
    domain: "mel.co",
    status: "active",
    verified: true,
    createdAt: new Date("2024-11-05"),
  },
  {
    id: "2",
    address: "sales@mel.co",
    domain: "mel.co",
    status: "pending",
    verified: false,
    createdAt: new Date("2024-12-01"),
  },
];

export const MOCK_WHATSAPP_CHANNELS: WhatsAppChannel[] = [
  {
    id: "1",
    wabaId: "WABA123456",
    phoneNumber: "+1 (555) 100-2000",
    businessName: "Mel's Place",
    displayName: "Mel Support",
    status: "active",
    createdAt: new Date("2024-11-20"),
  },
];

export const MOCK_TRANSCRIPTS: Transcript[] = [
  {
    id: "tr-1",
    phoneNumberId: "1",
    callerNumber: "+1 (555) 123-4567",
    tag: "Call escalated",
    duration: "4 mins 32 secs",
    startTime: "09:30 PM",
    endTime: "09:34 PM",
    date: new Date("2026-04-22T21:30:00"),
    cost: 0.048,
    agentName: "Susan",
    customerId: "cust-49231",
    direction: "Inbound",
    messages: [
      {
        id: "m1",
        role: "agent",
        text: "Hi there! How are you doing? I am Susan from Mel's place. How may I help you?",
        timestamp: "00:05",
      },
      {
        id: "m2",
        role: "customer",
        text: "Hi. I'm Ben. I recently ordered the Cameroonian palm oil. I want to find out the status.",
        timestamp: "00:18",
      },
      {
        id: "m3",
        role: "agent",
        text: "Of course! Let me pull up your order. Can you confirm your order number or the email used?",
        timestamp: "00:32",
      },
      {
        id: "m4",
        role: "customer",
        text: "Sure, it's order #49231 under ben.okoro@gmail.com.",
        timestamp: "00:48",
      },
      {
        id: "m5",
        role: "agent",
        text: "Thank you, Ben. I see your order is currently in transit. It should arrive within 2 business days.",
        timestamp: "01:05",
      },
      {
        id: "m6",
        role: "customer",
        text: "It's been 7 days already. This is unacceptable. Can I speak to a human agent please?",
        timestamp: "01:22",
      },
      {
        id: "m7",
        role: "agent",
        text: "I completely understand your frustration. I'm escalating this to our senior support team right now. They will contact you within the hour.",
        timestamp: "01:40",
      },
      {
        id: "m8",
        role: "customer",
        text: "Alright, thank you. I'll be waiting.",
        timestamp: "02:01",
      },
    ],
  },
  {
    id: "tr-2",
    phoneNumberId: "1",
    callerNumber: "+1 (555) 253-3857",
    tag: "Human handoff",
    duration: "2 mins 10 secs",
    startTime: "02:15 PM",
    endTime: "02:17 PM",
    date: new Date("2026-04-22T14:15:00"),
    cost: 0.022,
    agentName: "Alex",
    customerId: "cust-78432",
    direction: "Inbound",
    messages: [
      {
        id: "m1",
        role: "agent",
        text: "Hello! Thanks for calling. I'm Alex. How can I assist you today?",
        timestamp: "00:04",
      },
      {
        id: "m2",
        role: "customer",
        text: "Hi, I need to change the delivery address on my order. It was placed yesterday.",
        timestamp: "00:16",
      },
      {
        id: "m3",
        role: "agent",
        text: "I can help with that. Could you provide me with your order ID?",
        timestamp: "00:29",
      },
      {
        id: "m4",
        role: "customer",
        text: "It's order #67890.",
        timestamp: "00:38",
      },
      {
        id: "m5",
        role: "agent",
        text: "I see the order but address changes after dispatch need to be handled by our logistics team. I'll transfer you now.",
        timestamp: "00:55",
      },
      {
        id: "m6",
        role: "customer",
        text: "Okay, thank you.",
        timestamp: "01:10",
      },
    ],
  },
  {
    id: "tr-3",
    phoneNumberId: "1",
    callerNumber: "+1 (555) 876-5432",
    tag: "Resolved",
    duration: "6 mins 44 secs",
    startTime: "11:00 AM",
    endTime: "11:06 AM",
    date: new Date("2026-04-21T11:00:00"),
    cost: 0.071,
    agentName: "Susan",
    customerId: "cust-11245",
    direction: "Inbound",
    messages: [
      {
        id: "m1",
        role: "agent",
        text: "Good morning! This is Susan at Mel's place. How can I help you?",
        timestamp: "00:04",
      },
      {
        id: "m2",
        role: "customer",
        text: "Hi Susan, I'd like to know your return policy for food items.",
        timestamp: "00:17",
      },
      {
        id: "m3",
        role: "agent",
        text: "Great question! We accept returns on unopened food items within 14 days of delivery.",
        timestamp: "00:32",
      },
      {
        id: "m4",
        role: "customer",
        text: "What if the item arrived damaged?",
        timestamp: "00:48",
      },
      {
        id: "m5",
        role: "agent",
        text: "If the item arrived damaged, we'll offer a full refund or replacement at no cost to you. Just send us a photo of the damage.",
        timestamp: "01:02",
      },
      {
        id: "m6",
        role: "customer",
        text: "That's perfect. My jar of pepper soup base cracked during shipping.",
        timestamp: "01:28",
      },
      {
        id: "m7",
        role: "agent",
        text: "I'm sorry to hear that! I'll process a replacement for you right away. What's your order number?",
        timestamp: "01:45",
      },
      { id: "m8", role: "customer", text: "It's #33198.", timestamp: "02:00" },
      {
        id: "m9",
        role: "agent",
        text: "Got it. Your replacement has been scheduled for delivery within 3–5 business days. Is there anything else I can help you with?",
        timestamp: "02:18",
      },
      {
        id: "m10",
        role: "customer",
        text: "No, that's all. Thank you so much!",
        timestamp: "02:40",
      },
    ],
  },
  {
    id: "tr-4",
    phoneNumberId: "1",
    callerNumber: "+1 (555) 234-5678",
    duration: "1 min 55 secs",
    startTime: "08:45 AM",
    endTime: "08:47 AM",
    date: new Date("2026-04-21T08:45:00"),
    cost: 0.019,
    agentName: "Alex",
    customerId: "cust-29087",
    direction: "Outbound",
    messages: [
      {
        id: "m1",
        role: "agent",
        text: "Good morning! I'm Alex calling from Mel's place. Am I speaking with Mr. Daniels?",
        timestamp: "00:05",
      },
      {
        id: "m2",
        role: "customer",
        text: "Yes, this is he.",
        timestamp: "00:18",
      },
      {
        id: "m3",
        role: "agent",
        text: "Great! I'm calling to confirm your delivery scheduled for today between 2–4 PM. Will you be available?",
        timestamp: "00:28",
      },
      {
        id: "m4",
        role: "customer",
        text: "Actually, can we reschedule to tomorrow morning?",
        timestamp: "00:48",
      },
      {
        id: "m5",
        role: "agent",
        text: "Of course! I've updated your delivery to tomorrow between 9 AM and 12 PM. You'll receive a confirmation text shortly.",
        timestamp: "01:02",
      },
    ],
  },
  {
    id: "tr-5",
    phoneNumberId: "1",
    callerNumber: "+44 20 7946 0958",
    tag: "Call escalated",
    duration: "8 mins 12 secs",
    startTime: "04:30 PM",
    endTime: "04:38 PM",
    date: new Date("2026-04-20T16:30:00"),
  },
  {
    id: "tr-6",
    phoneNumberId: "1",
    callerNumber: "+1 (555) 321-0987",
    tag: "Resolved",
    duration: "3 mins 20 secs",
    startTime: "10:10 AM",
    endTime: "10:13 AM",
    date: new Date("2026-04-20T10:10:00"),
  },
  {
    id: "tr-7",
    phoneNumberId: "1",
    callerNumber: "+1 (555) 456-7890",
    duration: "5 mins 08 secs",
    startTime: "01:55 PM",
    endTime: "02:00 PM",
    date: new Date("2026-04-19T13:55:00"),
  },
  {
    id: "tr-8",
    phoneNumberId: "1",
    callerNumber: "+1 (555) 654-3210",
    tag: "Human handoff",
    duration: "7 mins 50 secs",
    startTime: "03:20 PM",
    endTime: "03:28 PM",
    date: new Date("2026-04-18T15:20:00"),
  },
  {
    id: "tr-9",
    phoneNumberId: "2",
    callerNumber: "+1 (555) 999-1234",
    tag: "Resolved",
    duration: "2 mins 45 secs",
    startTime: "11:30 AM",
    endTime: "11:33 AM",
    date: new Date("2026-04-22T11:30:00"),
  },
  {
    id: "tr-10",
    phoneNumberId: "3",
    callerNumber: "+44 20 7946 1111",
    tag: "Call escalated",
    duration: "12 mins 01 sec",
    startTime: "08:15 AM",
    endTime: "08:27 AM",
    date: new Date("2026-04-22T08:15:00"),
  },
];

const BASE_AGENT_WORKFLOWS: import("./types").AgentWorkflowRef[] = [
  {
    id: "wf-1",
    name: "Order status checker",
    status: "active",
    lastUpdated: new Date("2026-02-12T14:30:00"),
    isConnected: false,
  },
  {
    id: "wf-2",
    name: "QA Agent workflow",
    status: "active",
    lastUpdated: new Date("2026-03-05T16:38:00"),
    isConnected: true,
  },
];

const BASE_AGENT_KNOWLEDGE: import("./types").AgentKnowledgeItem[] = [
  {
    id: "kb-1",
    name: "Company privacy policy",
    sourceLabel: "Policy url",
    sourceUrl: "https://mirrro-ai-website.vercel.app/",
    createdByEmail: "melvis@melsplace.com",
    createdByInitial: "M",
    createdByColor: "bg-rose-600",
    lastUpdated: new Date("2026-02-12T14:30:00"),
  },
  {
    id: "kb-2",
    name: "Terms and conditions",
    sourceLabel: "Notion link",
    sourceUrl: "https://mirrro-ai-website.vercel.app/",
    createdByEmail: "melvis@melsplace.com",
    createdByInitial: "M",
    createdByColor: "bg-rose-600",
    lastUpdated: new Date("2026-01-12T15:22:00"),
  },
  {
    id: "kb-3",
    name: "Company support guide",
    sourceLabel: "Google drive link",
    sourceUrl: "https://mirrro-ai-website.vercel.app/",
    createdByEmail: "melvis@melsplace.com",
    createdByInitial: "M",
    createdByColor: "bg-rose-600",
    lastUpdated: new Date("2025-12-28T17:30:00"),
  },
  {
    id: "kb-4",
    name: "Customers orders",
    sourceLabel: "Google drive link",
    sourceUrl: "https://mirrro-ai-website.vercel.app/",
    createdByEmail: "melvis@melsplace.com",
    createdByInitial: "M",
    createdByColor: "bg-rose-600",
    lastUpdated: new Date("2025-12-28T17:30:00"),
  },
];

const BASE_AGENT_TOOLS: import("./types").AgentToolItem[] = [
  {
    id: "tool-1",
    name: "salesforce_get_client_contact",
    provider: "salesforce",
    providerLabel: "Salesforce",
    dateCreated: new Date("2026-02-12T00:00:00"),
  },
  {
    id: "tool-2",
    name: "zendesk_create_ticket",
    provider: "zendesk",
    providerLabel: "Zendesk",
    dateCreated: new Date("2026-02-12T00:00:00"),
  },
  {
    id: "tool-3",
    name: "slack_send_message",
    provider: "slack",
    providerLabel: "Slack",
    dateCreated: new Date("2026-02-12T00:00:00"),
  },
  {
    id: "tool-4",
    name: "g_sheet_update_row",
    provider: "google-sheet",
    providerLabel: "Google sheet",
    dateCreated: new Date("2026-02-12T00:00:00"),
  },
];

const BASE_AGENT_ESCALATION: import("./types").AgentEscalationSettings = {
  scenarios: {
    userRequestsHuman: true,
    negativeSentiment: true,
    agentStuck: true,
    toolCallFails: true,
    maxLengthExceeded: true,
  },
  destinations: {
    slack: true,
    zendesk: false,
    phoneTransfer: true,
  },
  handoff: {
    includeTranscript: false,
    includeCustomerInfo: true,
    includeSummary: true,
  },
};

export const MOCK_AGENTS: Agent[] = [
  {
    id: "a1",
    name: "Black Friday QA agent",
    status: "active",
    lastUsed: new Date("2026-03-02T16:40:00"),
    lastUpdated: new Date("2026-02-12T14:30:00"),
    workflows: BASE_AGENT_WORKFLOWS,
    knowledgeBase: BASE_AGENT_KNOWLEDGE,
    tools: BASE_AGENT_TOOLS,
    escalation: BASE_AGENT_ESCALATION,
  },
  {
    id: "a2",
    name: "HR Onboarding guide",
    status: "paused",
    lastUsed: new Date("2026-03-02T16:40:00"),
    lastUpdated: new Date("2026-02-12T14:30:00"),
    workflows: BASE_AGENT_WORKFLOWS.map((w) => ({ ...w, isConnected: false })),
    knowledgeBase: BASE_AGENT_KNOWLEDGE.slice(0, 2),
    tools: BASE_AGENT_TOOLS.slice(0, 2),
    escalation: BASE_AGENT_ESCALATION,
  },
  {
    id: "a3",
    name: "Supplier stock alert agent",
    status: "active",
    lastUsed: new Date("2026-03-02T16:40:00"),
    lastUpdated: new Date("2026-02-12T14:30:00"),
    workflows: BASE_AGENT_WORKFLOWS,
    knowledgeBase: BASE_AGENT_KNOWLEDGE.slice(2),
    tools: BASE_AGENT_TOOLS,
    escalation: BASE_AGENT_ESCALATION,
  },
];

export const MOCK_WORKSPACE_KNOWLEDGE_BASES: import("./types").AgentKnowledgeItem[] = [
  {
    id: "kb-w1",
    name: "Product FAQ",
    sourceLabel: "notion.so/faq",
    sourceUrl: "#",
    createdByEmail: "melvis@melsplace.com",
    createdByInitial: "M",
    createdByColor: "bg-rose-600",
    lastUpdated: new Date("2026-01-10T10:00:00"),
  },
  {
    id: "kb-w2",
    name: "Return Policy",
    sourceLabel: "docs.internal/returns",
    sourceUrl: "#",
    createdByEmail: "melvis@melsplace.com",
    createdByInitial: "M",
    createdByColor: "bg-rose-600",
    lastUpdated: new Date("2026-01-15T09:30:00"),
  },
  {
    id: "kb-w3",
    name: "Pricing Guide",
    sourceLabel: "notion.so/pricing",
    sourceUrl: "#",
    createdByEmail: "melvis@melsplace.com",
    createdByInitial: "M",
    createdByColor: "bg-rose-600",
    lastUpdated: new Date("2026-02-01T14:00:00"),
  },
  {
    id: "kb-w4",
    name: "Shipping Policy",
    sourceLabel: "docs.internal/shipping",
    sourceUrl: "#",
    createdByEmail: "melvis@melsplace.com",
    createdByInitial: "M",
    createdByColor: "bg-rose-600",
    lastUpdated: new Date("2026-02-10T11:00:00"),
  },
];

export const MOCK_WORKSPACE_TOOLS: import("./types").AgentToolItem[] = [
  {
    id: "tool-w1",
    name: "salesforce_get_client_contact",
    provider: "salesforce",
    providerLabel: "Salesforce",
    dateCreated: new Date("2026-01-10T00:00:00"),
  },
  {
    id: "tool-w2",
    name: "zendesk_create_ticket",
    provider: "zendesk",
    providerLabel: "Zendesk",
    dateCreated: new Date("2026-01-12T00:00:00"),
  },
  {
    id: "tool-w3",
    name: "slack_send_message",
    provider: "slack",
    providerLabel: "Slack",
    dateCreated: new Date("2026-01-15T00:00:00"),
  },
  {
    id: "tool-w4",
    name: "g_sheet_update_row",
    provider: "google-sheet",
    providerLabel: "Google Sheet",
    dateCreated: new Date("2026-01-20T00:00:00"),
  },
];

export const TEMPLATE_CATEGORIES: AgentTemplateCategory[] = [
  "All",
  "Healthcare",
  "Ecommerce",
  "Reception",
  "Sales",
  "Finance",
];

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "t1",
    name: "Order status helper",
    description:
      "Instantly answers customer questions about order status, tracking, and delivery delays across phone, WhatsApp, and SMS.",
    category: ["Ecommerce"],
  },
  {
    id: "t2",
    name: "Lead Qualification Agent",
    description:
      "Qualifies inbound leads from any channel, asks discovery questions, books meetings via Calendly, and updates Salesforce automatically.",
    category: ["Sales"],
  },
  {
    id: "t3",
    name: "Employee Onboarding Assistant",
    description:
      "Guides new hires through paperwork, benefits questions, and team intros while creating tasks in Asana and notifying HR.",
    category: ["Reception"],
  },
  {
    id: "t4",
    name: "Expense Approval Bot",
    description:
      "Processes employee expense requests, verifies receipts, checks policy limits, approves small amounts or escalates to finance.",
    category: ["Finance"],
  },
  {
    id: "t5",
    name: "Appointment Booking Agent",
    description:
      "Schedules, reschedules, and cancels patient or client appointments via voice and WhatsApp, syncing with your calendar in real time.",
    category: ["Healthcare", "Reception"],
  },
  {
    id: "t6",
    name: "Returns & Refunds Handler",
    description:
      "Manages return requests end-to-end — validates eligibility, initiates refunds, and sends status updates to customers automatically.",
    category: ["Ecommerce"],
  },
  {
    id: "t7",
    name: "Sales Outreach Agent",
    description:
      "Sends personalized follow-ups via email, SMS, and WhatsApp, tracks engagement, and updates CRM records without manual input.",
    category: ["Sales"],
  },
  {
    id: "t8",
    name: "Patient Follow-up Agent",
    description:
      "Sends post-visit care reminders, collects symptom check-ins, and flags urgent cases for clinical review via secure messaging.",
    category: ["Healthcare"],
  },
  {
    id: "t9",
    name: "Invoice Reminder Bot",
    description:
      "Automatically follows up on unpaid invoices, sends payment links, and escalates overdue accounts to your finance team.",
    category: ["Finance"],
  },
  {
    id: "t10",
    name: "Front Desk Receptionist",
    description:
      "Handles inbound calls and messages to answer FAQs, route inquiries, and book appointments — always on, never on hold.",
    category: ["Reception"],
  },
];

export const MOCK_CALL_LOGS: CallLog[] = [
  {
    id: "cl-1",
    phoneNumberId: "1",
    dateTime: new Date("2025-12-24T10:25:00"),
    callerId: "+1 (555) 123-4567",
    direction: "Inbound",
    status: "Answered",
    duration: "5:32",
  },
  {
    id: "cl-2",
    phoneNumberId: "1",
    dateTime: new Date("2025-12-24T20:05:00"),
    callerId: "+1 (555) 253-3857",
    direction: "Inbound / outbound",
    status: "Unanswered",
  },
  {
    id: "cl-3",
    phoneNumberId: "1",
    dateTime: new Date("2025-12-23T14:10:00"),
    callerId: "+1 (555) 876-5432",
    direction: "Inbound",
    status: "Answered",
    duration: "2:18",
  },
  {
    id: "cl-4",
    phoneNumberId: "1",
    dateTime: new Date("2025-12-23T09:47:00"),
    callerId: "+1 (555) 234-5678",
    direction: "Outbound",
    status: "Answered",
    duration: "8:04",
  },
  {
    id: "cl-5",
    phoneNumberId: "1",
    dateTime: new Date("2025-12-22T16:30:00"),
    callerId: "+44 20 7946 0958",
    direction: "Inbound",
    status: "Unanswered",
  },
  {
    id: "cl-6",
    phoneNumberId: "2",
    dateTime: new Date("2025-12-24T11:00:00"),
    callerId: "+1 (555) 999-1234",
    direction: "Outbound",
    status: "Answered",
    duration: "3:45",
  },
  {
    id: "cl-7",
    phoneNumberId: "3",
    dateTime: new Date("2025-12-24T08:15:00"),
    callerId: "+44 20 7946 1111",
    direction: "Inbound",
    status: "Answered",
    duration: "12:01",
  },
];
