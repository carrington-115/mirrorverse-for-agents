"use client";
import DashboardHeader from "@/components/custom/DashboardHeader";
import DashboardLayout from "@/components/custom/DashboardLayout";
import { Button } from "@/components/ui/button";
import { History, Loader2, Plus } from "lucide-react";
import mirrropilotIcon from "@/assets/mirrropilot-icon.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { generateSessionId } from "../actions";
import { useTransition } from "react";

export default function MirrropilotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNewSession = async () => {
    startTransition(async () => {
      const newSessionId = await generateSessionId();
      router.push(`/mirrropilot/${newSessionId}`);
    });
  };

  return (
    <div className="max-w-[calc(100%-16px)] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] border border-border relative overflow-y-scroll my-[6px] mx-[8px] rounded-lg">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Mirrropilot"
            icon={
              <Image
                src={mirrropilotIcon}
                alt="Mirrropilot"
                width={16}
                height={16}
              />
            }
            actions={
              <div className="flex gap-[var(--sm)]">
                <Button onClick={handleNewSession} className="cursor-pointer">
                  {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                  New session
                </Button>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  className="cursor-pointer"
                >
                  <History />
                </Button>
              </div>
            }
          />
        }
      >
        <div className="w-[80%] h-[calc(87vh-62px)] flex flex-col gap-[var(--xl)] items-center">
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}
