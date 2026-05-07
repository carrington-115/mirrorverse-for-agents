"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Shapes } from "lucide-react";
import {
  SiSlack,
  SiStripe,
  SiCalendly,
  SiNotion,
  SiWhatsapp,
  SiSalesforce,
  SiGoogleanalytics,
  SiZendesk,
} from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Integration, IntegrationCategory } from "@/lib/types";

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
    id: "stripe",
    name: "Stripe",
    description:
      "Payment processing platform for accepting online payments, subscriptions, and payouts.",
    icon: SiStripe,
    iconColor: "text-[#635BFF]",
    category: ["Ecommerce"],
  },
  {
    id: "calendly",
    name: "Calendly",
    description: "Automated scheduling tool for booking meetings without back-and-forth emails.",
    icon: SiCalendly,
    iconColor: "text-[#006BFF]",
    category: ["Scheduling", "Productivity"],
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
    id: "whatsapp",
    name: "WhatsApp",
    description:
      "Popular messaging app for business-customer text, voice, and media communication.",
    icon: SiWhatsapp,
    iconColor: "text-[#25D366]",
    category: ["Messaging"],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description:
      "Comprehensive CRM for tracking sales pipelines, customer data, and automating revenue processes.",
    icon: SiSalesforce,
    iconColor: "text-[#00A1E0]",
    category: ["Marketing", "Ecommerce"],
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
    id: "zendesk",
    name: "Zendesk",
    description:
      "Full-service customer support suite for ticketing, knowledge bases, and multi-channel helpdesk.",
    icon: SiZendesk,
    iconColor: "text-[#03363D]",
    category: ["Collaboration", "Messaging"],
  },
];

export const CATEGORIES: IntegrationCategory[] = [
  "All",
  "Marketing",
  "Collaboration",
  "Ecommerce",
  "Scheduling",
  "Productivity",
  "Messaging",
  "File storage",
];

export function IntegrationCard({
  integration,
  onAddIntegration,
  onViewDetails,
}: {
  integration: Integration;
  onAddIntegration: (i: Integration) => void;
  onViewDetails: (i: Integration) => void;
}) {
  const Icon = integration.icon;

  return (
    <div className="gap-4 p-4 hover:shadow-sm flex flex-col justify-between rounded-xl border border-border bg-background transition-shadow">
      <div className="gap-2 flex flex-col">
        <Icon className={cn("size-7", integration.iconColor)} />
        <h3 className="text-md font-semibold">{integration.name}</h3>
        <p className="text-sm line-clamp-3 text-muted-foreground">{integration.description}</p>
      </div>

      <div className="gap-2 flex">
        <Button
          size="sm"
          className="flex-1 cursor-pointer"
          onClick={() => onAddIntegration(integration)}
        >
          Add integration
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 cursor-pointer"
          onClick={() => onViewDetails(integration)}
        >
          View details
        </Button>
      </div>
    </div>
  );
}

const CREDENTIAL_LABELS: Record<string, string> = {
  "bot-oauth-id": "Bot OAuth ID",
  "api-key": "API Key",
  "access-token": "Access Token",
};

export function AddIntegrationSheet({
  open,
  onOpenChange,
  integration,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration | null;
}) {
  const [credentialType, setCredentialType] = useState("bot-oauth-id");
  const [credentialValue, setCredentialValue] = useState("");

  if (!integration) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Add integration</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="credentials" className="px-4">
          <TabsList variant="line">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="mt-4 gap-4 flex flex-col">
            <p className="text-sm text-muted-foreground">
              Select a credential to use for this integration.
            </p>

            <div className="gap-2 flex flex-col">
              <Select value={credentialType} onValueChange={setCredentialType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bot-oauth-id">Bot OAuth ID</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="access-token">Access Token</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="gap-2 flex flex-col">
              <Label>{CREDENTIAL_LABELS[credentialType] ?? "Credential"}</Label>
              <Input
                placeholder="Enter credential value"
                value={credentialValue}
                onChange={(e) => setCredentialValue(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="tools" className="mt-4">
            <p className="text-sm text-muted-foreground">Configure tools for {integration.name}.</p>
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            <div className="gap-3 flex flex-col">
              <div className="gap-3 flex items-center">
                <integration.icon className={cn("size-8", integration.iconColor)} />
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">Integration</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{integration.description}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-4 mt-auto">
          <Button className="w-full cursor-pointer">Add Integration</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function IntegrationsEmpty({ onAddIntegration }: { onAddIntegration: () => void }) {
  return (
    <Empty className="py-10 w-[80%] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Shapes />
        </EmptyMedia>
        <EmptyTitle>No integrations yet</EmptyTitle>
        <EmptyDescription>
          No integrations added yet — connect your favorite tools like Salesforce, HubSpot, Slack,
          or Google Workspace to unlock seamless data sync and powerful agent actions across your
          workflows.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="gap-2 flex">
          <Button onClick={onAddIntegration} className="cursor-pointer">
            <Shapes className="size-4" />
            Add integration
          </Button>
          <Button variant="outline" className="cursor-pointer">
            Manage integrations
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
