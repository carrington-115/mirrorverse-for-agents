"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { ChannelSearchBar } from "@/features/deploy/components/channel-search-bar";
import { ChannelEmptyState } from "@/features/deploy/components/channel-empty-state";
import {
  ChannelTable,
  VerificationBadge,
  type ChannelColumn,
  type ChannelAction,
} from "@/features/deploy/components/channel-table";
import { useListNumbersQuery } from "@/features/deploy/api/queries";
import { useReleaseNumberMutation } from "@/features/deploy/api/mutations";
import { AddPhoneChoiceDialog } from "@/features/deploy/components/phone/add-phone-choice-dialog";
import { AddPhoneSheet } from "@/features/deploy/components/phone/add-phone-sheet";
import { PhoneNumbersListSheet } from "@/features/deploy/components/phone/phone-numbers-list-sheet";
import type { PhoneNumber } from "@/lib/types";

export function ChannelsSettingsShell() {
  const router = useRouter();

  // Phone state
  const [phoneSearch, setPhoneSearch] = useState("");
  const [phoneDateFilter, setPhoneDateFilter] = useState("all");
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [twilioOpen, setTwilioOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [pendingReleaseId, setPendingReleaseId] = useState<string | null>(null);

  const { data: phoneNumbers = [], isLoading } = useListNumbersQuery();
  const { mutate: releaseNumber } = useReleaseNumberMutation();

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

  return (
    <div className="gap-6 flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Channels</h1>
        <p className="text-sm text-muted-foreground">
          Configure the channels where your agents are deployed.
        </p>
      </div>

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

      <AddPhoneChoiceDialog
        open={choiceOpen}
        onOpenChange={setChoiceOpen}
        onSelectTwilio={() => setTwilioOpen(true)}
        onSelectList={() => setListOpen(true)}
      />
      <AddPhoneSheet open={twilioOpen} onOpenChange={setTwilioOpen} />
      <PhoneNumbersListSheet open={listOpen} onOpenChange={setListOpen} />

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
