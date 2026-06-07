"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plug, Plus } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ChannelSearchBar } from "@/features/deploy/components/channel-search-bar";
import { ChannelEmptyState } from "@/features/deploy/components/channel-empty-state";
import {
  ChannelTable,
  VerificationBadge,
  StatusBadge,
  type ChannelColumn,
  type ChannelAction,
} from "@/features/deploy/components/channel-table";
import { useListNumbersQuery } from "@/features/deploy/api/queries";
import { useReleaseNumberMutation } from "@/features/deploy/api/mutations";
import { AddPhoneChoiceDialog } from "@/features/deploy/components/phone/add-phone-choice-dialog";
import { AddPhoneSheet } from "@/features/deploy/components/phone/add-phone-sheet";
import { PhoneNumbersListSheet } from "@/features/deploy/components/phone/phone-numbers-list-sheet";
import { AddWhatsAppSheet } from "@/features/deploy/components/whatsapp/add-whats-app-sheet";
import { MOCK_WHATSAPP_CHANNELS } from "@/lib/data";
import type { PhoneNumber, WhatsAppChannel } from "@/lib/types";

type ChannelTab = "phone" | "whatsapp";

export function ChannelsSettingsShell() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ChannelTab>("phone");

  // Phone state
  const [phoneSearch, setPhoneSearch] = useState("");
  const [phoneDateFilter, setPhoneDateFilter] = useState("all");
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [twilioOpen, setTwilioOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [pendingReleaseId, setPendingReleaseId] = useState<string | null>(null);

  // WhatsApp state
  const [waSearch, setWaSearch] = useState("");
  const [waDateFilter, setWaDateFilter] = useState("all");
  const [addWaOpen, setAddWaOpen] = useState(false);

  const { data: phoneNumbers = [], isLoading } = useListNumbersQuery();
  const { mutate: releaseNumber } = useReleaseNumberMutation();

  const channels = MOCK_WHATSAPP_CHANNELS;

  const filteredPhone = useMemo(() => {
    const q = phoneSearch.toLowerCase();
    const now = new Date();
    return phoneNumbers.filter((n) => {
      const matchesSearch =
        n.number.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.callType.toLowerCase().includes(q) ||
        n.purpose.toLowerCase().includes(q) ||
        (n.assignedAgent?.toLowerCase().includes(q) ?? false);

      let matchesDate = true;
      if (phoneDateFilter === "today") {
        matchesDate = n.createdAt.toDateString() === now.toDateString();
      } else if (phoneDateFilter === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        matchesDate = n.createdAt >= startOfWeek;
      } else if (phoneDateFilter === "month") {
        matchesDate =
          n.createdAt.getMonth() === now.getMonth() &&
          n.createdAt.getFullYear() === now.getFullYear();
      }
      return matchesSearch && matchesDate;
    });
  }, [phoneNumbers, phoneSearch, phoneDateFilter]);

  const filteredWa = useMemo(() => {
    const q = waSearch.toLowerCase();
    const now = new Date();
    return channels.filter((c) => {
      const matchesSearch =
        c.phoneNumber.toLowerCase().includes(q) ||
        c.businessName.toLowerCase().includes(q) ||
        c.displayName.toLowerCase().includes(q);

      let matchesDate = true;
      if (waDateFilter === "today") {
        matchesDate = c.createdAt.toDateString() === now.toDateString();
      } else if (waDateFilter === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        matchesDate = c.createdAt >= startOfWeek;
      } else if (waDateFilter === "month") {
        matchesDate =
          c.createdAt.getMonth() === now.getMonth() &&
          c.createdAt.getFullYear() === now.getFullYear();
      }
      return matchesSearch && matchesDate;
    });
  }, [channels, waSearch, waDateFilter]);

  const phoneCount = phoneNumbers.length;
  const waCount = channels.length;

  const phoneColumns: ChannelColumn<PhoneNumber>[] = [
    {
      key: "number",
      header: "Phone number",
      sortable: true,
      render: (row) => <span className="font-medium font-mono">{row.number}</span>,
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      render: (row) => <span className="text-muted-foreground">{row.description}</span>,
    },
    {
      key: "callType",
      header: "Type",
      render: (row) => <span>{row.callType}</span>,
    },
    {
      key: "verificationStatus",
      header: "Verification",
      render: (row) => <VerificationBadge status={row.verificationStatus} />,
    },
    {
      key: "createdAt",
      header: "Date added",
      mobileHide: true,
      render: (row) => (
        <span className="text-muted-foreground">
          {row.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  const phoneActions: ChannelAction<PhoneNumber>[] = [
    {
      label: "View call logs",
      onClick: (row) => router.push(`/deploy/phone/${row.id}/call-logs`),
    },
    { label: "Edit", onClick: () => toast.info("Edit coming soon") },
    { label: "Delete", onClick: (row) => setPendingReleaseId(row.id), destructive: true },
  ];

  const waColumns: ChannelColumn<WhatsAppChannel>[] = [
    {
      key: "phoneNumber",
      header: "Phone number",
      render: (row) => <span className="font-medium font-mono">{row.phoneNumber}</span>,
    },
    {
      key: "businessName",
      header: "Business name",
      render: (row) => <span className="text-sm">{row.businessName}</span>,
    },
    {
      key: "displayName",
      header: "Display name",
      render: (row) => <span className="text-sm text-muted-foreground">{row.displayName}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Date added",
      mobileHide: true,
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  const waActions: ChannelAction<WhatsAppChannel>[] = [
    {
      label: "View conversations",
      onClick: (row) => router.push(`/deploy/whatsapp/${row.id}/conversations`),
    },
    { label: "Edit", onClick: () => toast.info("Edit coming soon") },
    { label: "Delete", onClick: () => toast.info("Delete coming soon"), destructive: true },
  ];

  return (
    <div className="gap-6 flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Channels</h1>
        <p className="text-sm text-muted-foreground">
          Configure the channels where your agents are deployed.
        </p>
      </div>

      {/* Badge tab switcher */}
      <div className="gap-2 flex items-center">
        {(
          [
            { id: "phone", label: "Phone", count: phoneCount },
            { id: "whatsapp", label: "WhatsApp", count: waCount },
          ] as { id: ChannelTab; label: string; count: number }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "gap-1.5 px-3 py-1.5 text-sm font-medium flex items-center rounded-full transition-colors",
              activeTab === tab.id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full leading-none",
                  activeTab === tab.id ? "bg-background/20" : "bg-background text-foreground",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "phone" && (
        <div className="gap-4 flex flex-col">
          <div className="flex items-center justify-between">
            <ChannelSearchBar
              searchPlaceholder="Search phone number"
              searchValue={phoneSearch}
              onSearchChange={setPhoneSearch}
              dateFilter={phoneDateFilter}
              onDateFilterChange={setPhoneDateFilter}
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-3 gap-1.5 shrink-0"
              onClick={() => setChoiceOpen(true)}
            >
              <Plus className="size-3.5" />
              Add number
            </Button>
          </div>
          <Separator />

          {isLoading ? (
            <div className="py-8 text-sm flex items-center justify-center text-muted-foreground">
              Loading phone numbers...
            </div>
          ) : filteredPhone.length === 0 && phoneSearch === "" ? (
            <ChannelEmptyState
              title="No added phone numbers yet"
              description="Add your first phone number to enable automated outbound/inbound calls — your agents can use verified numbers for support, sales, and appointment reminders."
              primaryLabel="Add phone number"
              onPrimary={() => setChoiceOpen(true)}
            />
          ) : filteredPhone.length === 0 ? (
            <div className="py-8 text-sm flex items-center justify-center text-muted-foreground">
              No phone numbers match your search.
            </div>
          ) : (
            <ChannelTable
              rows={filteredPhone}
              columns={phoneColumns}
              actions={phoneActions}
              title="Phone numbers"
              showDragHandle
              showCheckbox
            />
          )}
        </div>
      )}

      {activeTab === "whatsapp" && (
        <div className="gap-4 flex flex-col">
          <div className="flex items-center justify-between">
            <ChannelSearchBar
              searchPlaceholder="Search WhatsApp number"
              searchValue={waSearch}
              onSearchChange={setWaSearch}
              dateFilter={waDateFilter}
              onDateFilterChange={setWaDateFilter}
            />
            <div className="ml-3 gap-2 flex shrink-0 items-center">
              {channels.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setAddWaOpen(true)}
                >
                  <Plus className="size-3.5" />
                  Add number
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full"
                onClick={() => router.push("/integrations")}
              >
                <Plug className="size-3.5" />
                Activate integration
              </Button>
            </div>
          </div>
          <Separator />

          {filteredWa.length === 0 && waSearch === "" ? (
            <ChannelEmptyState
              title="Get started with WhatsApp"
              description="Add your first WhatsApp Business number to let your agents handle customer messages, order updates, and support requests directly on WhatsApp."
              primaryLabel="Add WhatsApp number"
              secondaryLabel="Activate integration"
              onPrimary={() => setAddWaOpen(true)}
              onSecondary={() => router.push("/integrations")}
            />
          ) : filteredWa.length === 0 ? (
            <div className="py-8 text-sm flex items-center justify-center text-muted-foreground">
              No WhatsApp numbers match your search.
            </div>
          ) : (
            <ChannelTable
              rows={filteredWa}
              columns={waColumns}
              actions={waActions}
              showDragHandle
              showCheckbox
            />
          )}
        </div>
      )}

      <AddPhoneChoiceDialog
        open={choiceOpen}
        onOpenChange={setChoiceOpen}
        onSelectTwilio={() => setTwilioOpen(true)}
        onSelectList={() => setListOpen(true)}
      />
      <AddPhoneSheet open={twilioOpen} onOpenChange={setTwilioOpen} />
      <PhoneNumbersListSheet open={listOpen} onOpenChange={setListOpen} />
      <AddWhatsAppSheet open={addWaOpen} onOpenChange={setAddWaOpen} />

      <AlertDialog
        open={pendingReleaseId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingReleaseId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete phone number?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently release{" "}
              <span className="font-medium text-foreground">
                {phoneNumbers.find((n) => n.id === pendingReleaseId)?.number ?? "this phone number"}
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (pendingReleaseId) releaseNumber({ phoneNumberId: pendingReleaseId });
                setPendingReleaseId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
