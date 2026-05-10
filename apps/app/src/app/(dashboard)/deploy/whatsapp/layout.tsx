"use client";

import DashboardHeader from "@/components/custom/dashboard-header";
import DashboardLayout from "@/components/custom/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-scroll rounded-lg border border-border">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Channels"
            icon={<Megaphone size={16} />}
            actions={
              <Button
                className="cursor-pointer"
                onClick={() => toast.info("Channel configuration coming soon")}
              >
                Configure channel
              </Button>
            }
          />
        }
      >
        <div className="pt-0! flex w-[80%] flex-col items-center gap-(--xl) p-(--lg)">
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}
