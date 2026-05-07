"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Plug, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppChannel } from "@/lib/types";

export default function WhatsAppDetailHeader({ channel }: { channel: WhatsAppChannel }) {
  const router = useRouter();

  return (
    <div className="gap-2 flex flex-col">
      <button
        onClick={() => router.push("/deploy/whatsapp")}
        className="gap-1 text-sm flex w-fit items-center text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back
      </button>

      <div className="flex items-center justify-between">
        <div className="gap-2 flex flex-wrap items-center">
          <h1 className="font-semibold text-[30px] leading-[30px] tracking-[-1px] text-foreground">
            {channel.phoneNumber}
          </h1>
          <Badge className="text-xs font-semibold px-2 py-0.5 rounded-full bg-foreground text-background">
            Active
          </Badge>
          <Badge className="bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {channel.displayName}
          </Badge>
          <Badge className="bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Approved
          </Badge>
          <Badge className="bg-amber-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {channel.wabaId}
          </Badge>
        </div>

        <div className="gap-3 flex shrink-0 items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => router.push("/integrations")}
          >
            <Plug className="size-3.5" />
            Activate integration
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => toast.info("Run test coming soon")}
          >
            <FlaskConical className="size-3.5" />
            Run test
          </Button>
        </div>
      </div>
    </div>
  );
}
