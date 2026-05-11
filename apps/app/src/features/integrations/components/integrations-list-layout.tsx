"use client";

import { useState } from "react";
import { Plug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { AddMcpDialog } from "@/features/integrations/components/add-mcp-dialog";
import { useCreateMcpServerMutation } from "@/features/tools/api/mutations";

export function IntegrationsListLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createMcp = useCreateMcpServerMutation();

  return (
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-scroll rounded-lg border border-border">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Integrations"
            icon={<Plug size={16} />}
            actions={
              <Button className="cursor-pointer" onClick={() => setOpen(true)}>
                Add MCP
              </Button>
            }
          />
        }
      >
        <div className="pt-0! flex w-[90%] flex-col items-center gap-(--xl) p-(--lg)">
          {children}
        </div>
      </DashboardLayout>

      <AddMcpDialog
        open={open}
        onOpenChangeAction={setOpen}
        onSubmitAction={async (values) => {
          try {
            const server = await createMcp.mutateAsync(values);
            toast.success(`Added MCP "${server.name}"`);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to add MCP";
            toast.error(message);
            throw err;
          }
        }}
      />
    </div>
  );
}
