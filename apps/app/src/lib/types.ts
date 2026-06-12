import React, { ReactNode } from "react";
import { IconBaseProps } from "react-icons/lib";

export interface SignInFormProps {
  email: string;
  password: string;
}

export interface NavigationPosition {
  name: string;
  href: string;
  active: boolean;
  setActive?: () => void;
}

type _AppIconProps = IconBaseProps;
export type IconComponent = React.ComponentType<IconBaseProps>;

export interface appStructure {
  name: string;
  description: string;
  url: string;
  icon: React.ComponentType<any>;
}

export interface appSelectProps extends appStructure {
  selected: boolean;
  onSelect: (app: appStructure) => void;
}

export interface appActiveProps {
  app: appStructure;
  selected: boolean;
}

export interface OrganizationProps {
  OrganizationLogo: string;
  organizationName: string;
  team: string;
  userRole: "member" | "admin";
  orgAction: () => void;
}

export interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  badgeNumber: number;
  badgeColor: string;
  onClick: () => void;
}

export type BadgeVariant = "green" | "blue" | "red" | "amber";

export interface KnowledgeBaseCardProps {
  icon: ReactNode;
  label: string;
  count: string | number;
  badgeVariant: BadgeVariant;
  onClick?: () => void;
  className?: string;
}

export interface KnowledgeBaseProps {
  onAddUrl?: () => void;
  onAddText?: () => void;
  onAddFiles?: () => void;
  onCreateFolder?: () => void;
  urlCount?: number | string;
  textCount?: number | string;
  fileCount?: number | string;
  folderCount?: number | string;
  className?: string;
}

export type KnowledgeBaseFileType = "URL" | "File";

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  url?: string;
  createdBy: {
    name: string;
    avatar?: string;
  };
  totalRagSearch: number;
  fileType: KnowledgeBaseFileType;
  lastUpdated: Date;
}

export interface KnowledgeBaseTableProps {
  items: KnowledgeBaseItem[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onItemAction?: (item: KnowledgeBaseItem, action: string) => void;
  className?: string;
}

export type IntegrationCategory =
  | "All"
  | "Marketing"
  | "Collaboration"
  | "Ecommerce"
  | "Scheduling"
  | "Productivity"
  | "Messaging"
  | "File storage"
  | "CRM"
  | "Customer support";

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  iconColor: string;
  category: IntegrationCategory[];
  connected?: boolean;
}

export interface Tool {
  id: string;
  name: string;
  type: "webhook" | "integration";
  description: string;
  method?: string;
  url?: string;
  status: "active" | "inactive";
  createdAt: Date;
  iconKey?: string;
}

export type ChannelStatus = "active" | "inactive" | "pending";

export interface PhoneNumber {
  id: string;
  number: string;
  provider: "twilio";
  status: ChannelStatus;
  description: string;
  callType: "Inbound" | "Outbound" | "All";
  purpose: string;
  verificationStatus: "verified" | "pending";
  assignedAgent?: string;
  createdAt: Date;
}

export interface EmailChannel {
  id: string;
  address: string;
  domain: string;
  status: ChannelStatus;
  verified: boolean;
  provider?: string;
  createdAt: Date;
}

export interface CallLog {
  id: string;
  phoneNumberId: string;
  dateTime: Date;
  callerId: string;
  direction: "Inbound" | "Outbound" | "Inbound / outbound";
  status: "Answered" | "Unanswered";
  duration?: string;
}

export interface WhatsAppChannel {
  id: string;
  wabaId: string;
  phoneNumber: string;
  businessName: string;
  displayName: string;
  status: ChannelStatus;
  createdAt: Date;
}

export interface TranscriptMessage {
  id: string;
  role: "agent" | "customer";
  text: string;
  timestamp: string;
}

export interface Transcript {
  id: string;
  phoneNumberId: string;
  callerNumber: string;
  tag?: string;
  duration: string;
  startTime: string;
  endTime: string;
  audioUrl?: string;
  date: Date;
  messages?: TranscriptMessage[];
  cost?: number;
  agentName?: string;
  customerId?: string;
  direction?: "Inbound" | "Outbound";
}

export type AgentStatus = "active" | "paused" | "inactive";

export interface AgentWorkflowRef {
  id: string;
  name: string;
  status: "active" | "inactive";
  lastUpdated: Date;
  isConnected: boolean;
}

export interface AgentKnowledgeItem {
  id: string;
  name: string;
  sourceLabel: string;
  sourceUrl: string;
  createdByEmail: string;
  createdByInitial: string;
  createdByColor: string;
  lastUpdated: Date;
}

export type AgentToolProvider = "salesforce" | "zendesk" | "slack" | "google-sheet";

export interface AgentToolItem {
  id: string;
  name: string;
  provider: AgentToolProvider;
  providerLabel: string;
  dateCreated: Date;
}

export interface AgentEscalationSettings {
  scenarios: {
    userRequestsHuman: boolean;
    negativeSentiment: boolean;
    agentStuck: boolean;
    toolCallFails: boolean;
    maxLengthExceeded: boolean;
  };
  destinations: {
    slack: boolean;
    zendesk: boolean;
    phoneTransfer: boolean;
  };
  handoff: {
    includeTranscript: boolean;
    includeCustomerInfo: boolean;
    includeSummary: boolean;
  };
}

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  lastUsed: Date;
  lastUpdated: Date;
  workflows?: AgentWorkflowRef[];
  knowledgeBase?: AgentKnowledgeItem[];
  tools?: AgentToolItem[];
  escalation?: AgentEscalationSettings;
}

export type AgentTemplateCategory =
  | "All"
  | "Healthcare"
  | "Ecommerce"
  | "Reception"
  | "Sales"
  | "Finance";

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: AgentTemplateCategory[];
}

export type WorkflowKind = "automation" | "chat-agent" | "voice-agent" | "code";

export interface Workflow {
  id: string;
  name: string;
  status: "active" | "inactive";
  kind: WorkflowKind;
  lastUpdated: Date;
  respondsToSlackMentions: boolean;
}

export type ConfigSidebarType =
  | "agent"
  | "knowledge-base"
  | "tools"
  | "general-tools"
  | "triggers"
  | "trigger-settings"
  | "action"
  | "action-settings"
  | "system-tools"
  | "tool-settings"
  | "escalation";

export interface WorkflowChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  thoughtDuration?: number;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  configType: ConfigSidebarType;
}
