"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plug, Plus } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { WhatsAppChannel } from "@/lib/types";
import { MOCK_WHATSAPP_CHANNELS } from "@/lib/data";
import { ChannelSearchBar } from "@/features/deploy/components/channel-search-bar";
import { ChannelEmptyState } from "@/features/deploy/components/channel-empty-state";
import {
  ChannelTable,
  StatusBadge,
  type ChannelColumn,
  type ChannelAction,
} from "@/features/deploy/components/channel-table";
import { AddWhatsAppSheet } from "./add-whats-app-sheet";

const USE_MOCK_DATA = true;

export function WhatsAppShell() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const channels = USE_MOCK_DATA ? MOCK_WHATSAPP_CHANNELS : [];

  const filtered = useMemo(() => {
    const now = new Date();
    return channels.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.phoneNumber.toLowerCase().includes(q) ||
        c.businessName.toLowerCase().includes(q) ||
        c.displayName.toLowerCase().includes(q);

      let matchesDate = true;
      if (dateFilter === "today") {
        matchesDate = c.createdAt.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        matchesDate = c.createdAt >= startOfWeek;
      } else if (dateFilter === "month") {
        matchesDate =
          c.createdAt.getMonth() === now.getMonth() &&
          c.createdAt.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesDate;
    });
  }, [channels, search, dateFilter]);

  const activeCount = channels.filter((c) => c.status === "active").length;

  const columns: ChannelColumn<WhatsAppChannel>[] = [
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
      key: "wabaId",
      header: "WABA ID",
      render: (row) => (
        <span className="text-xs font-mono text-muted-foreground">{row.wabaId}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Date added",
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

  const actions: ChannelAction<WhatsAppChannel>[] = [
    {
      label: "View details",
      onClick: (row) => router.push(`/deploy/whatsapp/${row.id}/conversations`),
    },
    {
      label: "Edit",
      onClick: () => toast.info("Edit coming soon"),
    },
    {
      label: "Delete",
      onClick: () => toast.info("Delete coming soon"),
      destructive: true,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      <div className="flex items-center justify-between">
        <div className="gap-2 flex items-center">
          <h2 className="font-semibold text-[30px] leading-[30px] tracking-[-1px] text-foreground">
            WhatsApp
          </h2>
          {activeCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-foreground text-background">
              {activeCount} Active
            </span>
          )}
        </div>
        <div className="gap-2 flex items-center">
          {channels.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-3.5" />
              Add WhatsApp number
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

      <ChannelSearchBar
        searchPlaceholder="Search WhatsApp number"
        searchValue={search}
        onSearchChange={setSearch}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
      />
      <Separator />

      {filtered.length === 0 && search === "" ? (
        <ChannelEmptyState
          title="Get started with WhatsApp"
          description="Add your first WhatsApp Business number to let your agents handle customer messages, order updates, inquiries, and support requests directly on WhatsApp — with full context from your shared memory and seamless handoffs when needed."
          primaryLabel="Add WhatsApp number"
          secondaryLabel="Activate integration"
          onPrimary={() => setAddOpen(true)}
          onSecondary={() => router.push("/integrations")}
        />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-sm flex flex-col items-center justify-center text-muted-foreground">
          No WhatsApp numbers match your search.
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

      <AddWhatsAppSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
