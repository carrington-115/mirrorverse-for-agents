export type WebhookAuthType = "none" | "bearer" | "basic" | "custom_header";

export interface WebhookCustomHeader {
  name: string;
  value: string;
}

export interface Webhook {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  url: string;
  authType: WebhookAuthType;
  customHeaders: WebhookCustomHeader[];
  timeoutSeconds: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEndpoint {
  id: string;
  workspaceId: string;
  workflowId: string;
  triggerNodeId: string;
  slug: string;
  secret: string;
  verifySignature: boolean;
  enabled: boolean;
  lastCalledAt: string | null;
  callsLast24h: number;
  createdAt: string;
  updatedAt: string;
}
