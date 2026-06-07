export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    profile: (userId: string, orgId: string) =>
      [...queryKeys.auth.all, "profile", userId, orgId] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },
  workflows: {
    all: ["workflows"] as const,
    list: () => [...queryKeys.workflows.all, "list"] as const,
    detail: (id: string) => [...queryKeys.workflows.all, "detail", id] as const,
  },
  deploy: {
    all: ["deploy"] as const,
    phone: {
      all: ["deploy", "phone"] as const,
      list: () => [...queryKeys.deploy.phone.all, "list"] as const,
      detail: (id: string) => [...queryKeys.deploy.phone.all, "detail", id] as const,
      callLogs: (id: string) => [...queryKeys.deploy.phone.detail(id), "call-logs"] as const,
    },
    whatsapp: {
      all: ["deploy", "whatsapp"] as const,
      list: () => [...queryKeys.deploy.whatsapp.all, "list"] as const,
      detail: (id: string) => [...queryKeys.deploy.whatsapp.all, "detail", id] as const,
      conversations: (id: string) =>
        [...queryKeys.deploy.whatsapp.detail(id), "conversations"] as const,
    },
  },
  integrations: {
    all: ["integrations"] as const,
    list: () => [...queryKeys.integrations.all, "list"] as const,
  },
  chat: {
    all: ["chat"] as const,
    session: (sessionId: string) => [...queryKeys.chat.all, "session", sessionId] as const,
  },
  billing: {
    all: ["billing"] as const,
    plan: (workspaceId: string) => [...queryKeys.billing.all, "plan", workspaceId] as const,
    invoices: (workspaceId: string) => [...queryKeys.billing.all, "invoices", workspaceId] as const,
    usage: (workspaceId: string) => [...queryKeys.billing.all, "usage", workspaceId] as const,
  },
};
