"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PhoneNumber } from "@/lib/types";
import { MOCK_PHONE_NUMBERS } from "@/lib/data";
import ChannelSearchBar from "../../_components/channel-search-bar";
import ChannelEmptyState from "../../_components/channel-empty-state";
import ChannelTable, {
  VerificationBadge,
  ChannelColumn,
  ChannelAction,
} from "../../_components/channel-table";
import AddPhoneSheet from "./add-phone-sheet";

const USE_MOCK_DATA = true;

export default function PhonePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const phoneNumbers = USE_MOCK_DATA ? MOCK_PHONE_NUMBERS : [];

  const filtered = phoneNumbers.filter((n) => {
    const q = search.toLowerCase();
    const matchesSearch =
      n.number.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.callType.toLowerCase().includes(q) ||
      n.purpose.toLowerCase().includes(q) ||
      (n.assignedAgent?.toLowerCase().includes(q) ?? false);

    const now = new Date();
    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate = n.createdAt.toDateString() === now.toDateString();
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      matchesDate = n.createdAt >= startOfWeek;
    } else if (dateFilter === "month") {
      matchesDate =
        n.createdAt.getMonth() === now.getMonth() &&
        n.createdAt.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesDate;
  });

  const activeCount = phoneNumbers.filter((n) => n.status === "active").length;

  const columns: ChannelColumn<PhoneNumber>[] = [
    {
      key: "number",
      header: "Phone number",
      sortable: true,
      render: (row) => (
        <Link
          href={`/deploy/phone/${row.id}/call-logs`}
          className="font-medium font-mono hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.number}
        </Link>
      ),
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
      key: "purpose",
      header: "Purpose",
      render: (row) => <span className="text-muted-foreground">{row.purpose}</span>,
    },
    {
      key: "verificationStatus",
      header: "Verification status",
      render: (row) => <VerificationBadge status={row.verificationStatus} />,
    },
    {
      key: "createdAt",
      header: "Date added",
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

  const actions: ChannelAction<PhoneNumber>[] = [
    { label: "View details", onClick: (row) => router.push(`/deploy/phone/${row.id}/call-logs`) },
    { label: "Edit", onClick: () => toast.info("Edit coming soon") },
    {
      label: "Delete",
      onClick: () => toast.info("Delete coming soon"),
      destructive: true,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      {/* Page title row */}
      <div className="flex items-center justify-between">
        <div className="gap-2 flex items-center">
          <h2 className="font-semibold text-[30px] leading-[30px] tracking-[-1px] text-foreground">
            Phone numbers
          </h2>
          {activeCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-foreground text-background">
              {activeCount} Active
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          Add phone number
        </Button>
      </div>

      {/* Search + filter row */}
      <ChannelSearchBar
        searchPlaceholder="Search phone number"
        searchValue={search}
        onSearchChange={setSearch}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
      />
      <Separator />

      {/* Content */}
      {filtered.length === 0 && search === "" ? (
        <ChannelEmptyState
          title="No Added phone numbers yet"
          description="Add your first phone number to enable automated outbound/inbound calls — your superagents can use verified numbers for support inquiries, sales outreach, order updates, or appointment reminders across industries."
          primaryLabel="Add phone number"
          secondaryLabel="Configure channels"
          onPrimary={() => setAddOpen(true)}
          onSecondary={() => toast.info("Configure channels coming soon")}
        />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-sm flex items-center justify-center text-muted-foreground">
          No phone numbers match your search.
        </div>
      ) : (
        <ChannelTable
          rows={filtered}
          columns={columns}
          actions={actions}
          showDragHandle
          showCheckbox
        />
      )}

      <AddPhoneSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
