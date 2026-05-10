import { buildMetadata } from "@/lib/seo/metadata";
import {
  ConversationsTable,
  type WhatsAppConversation,
} from "@/features/deploy/components/whatsapp/conversations-table";

export const metadata = buildMetadata({
  title: "Conversations",
  description: "Review WhatsApp conversations handled by your agents.",
  noIndex: true,
});

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

const MOCK_CONVERSATIONS: WhatsAppConversation[] = [
  {
    id: "1",
    contact: "+1 (415) 823-4521",
    timestamp: daysAgo(0),
    agentAssigned: "Sales Superagent",
    messageCount: 87,
    duration: "4 min",
    status: "Resolved",
  },
  {
    id: "2",
    contact: "+44 7700 900342",
    timestamp: daysAgo(0),
    agentAssigned: "Support Superagent",
    messageCount: 3,
    duration: "1 min",
    status: "Ongoing",
  },
  {
    id: "3",
    contact: "+1 (212) 555-0198",
    timestamp: daysAgo(3),
    agentAssigned: "Billing Superagent",
    messageCount: 21,
    duration: "18 min",
    status: "Escalated",
  },
  {
    id: "4",
    contact: "+234 803 456 7890",
    timestamp: daysAgo(10),
    agentAssigned: "Sales Superagent",
    messageCount: 5,
    duration: "2 min",
    status: "Dropped",
  },
  {
    id: "5",
    contact: "+61 412 345 678",
    timestamp: daysAgo(20),
    agentAssigned: "Support Superagent",
    messageCount: 15,
    duration: "7 min",
    status: "Resolved",
  },
];

export function ConversationsPage() {
  return <ConversationsTable data={MOCK_CONVERSATIONS} />;
}
