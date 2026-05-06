"use client";

import DashboardHeader from "@/components/custom/DashboardHeader";
import DashboardLayout from "@/components/custom/DashboardLayout";
import { Plus, SquareUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[calc(100%-16px)] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] border border-border relative overflow-y-scroll my-[6px] mx-[8px] rounded-lg">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Agent"
            icon={<SquareUserRound size={16} />}
            actions={
              <Button
                onClick={() =>
                  toast.success("New workflow created is on the way")
                }
                className="cursor-pointer"
              >
                <Plus /> New workflow
              </Button>
            }
          />
        }
      >
        <div className="w-[90%] flex flex-col gap-[var(--xl)] items-center !pt-0 p-[var(--lg)]">
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}
