"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plug, Plus } from "lucide-react";
import { WhatsAppChannel } from "@/lib/types";
import { MOCK_WHATSAPP_CHANNELS } from "@/lib/data";
import ChannelSearchBar from "../../_components/ChannelSearchBar";
import ChannelEmptyState from "../../_components/ChannelEmptyState";
import ChannelTable, {
  StatusBadge,
  ChannelColumn,
  ChannelAction,
} from "../../_components/ChannelTable";
import AddWhatsAppSheet from "./AddWhatsAppSheet";
import { toast } from "sonner";

const USE_MOCK_DATA = true;

export default function WhatsAppPage() {
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
      render: (row) => (
        <span className="font-medium font-mono">{row.phoneNumber}</span>
      ),
    },
    {
      key: "businessName",
      header: "Business name",
      render: (row) => <span className="text-sm">{row.businessName}</span>,
    },
    {
      key: "displayName",
      header: "Display name",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.displayName}</span>
      ),
    },
    {
      key: "wabaId",
      header: "WABA ID",
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.wabaId}
        </span>
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
    <div className="flex flex-col gap-[var(--md,16px)] w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[30px] font-semibold leading-[30px] tracking-[-1px] text-foreground">
            WhatsApp
          </h2>
          {activeCount > 0 && (
            <span className="bg-foreground text-background text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeCount} Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
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
            className="rounded-full gap-1.5"
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
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm">
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
