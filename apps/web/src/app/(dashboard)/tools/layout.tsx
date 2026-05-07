"use client";

import DashboardHeader from "@/components/custom/dashboard-header";
import DashboardLayout from "@/components/custom/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Plus, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-scroll rounded-lg border border-border">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Tools"
            icon={<Wrench size={16} />}
            actions={
              <Button className="cursor-pointer" onClick={() => router.push("?addTool=1")}>
                <Plus />
                Add new tool
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
