"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Plug, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppChannel } from "@/lib/types";

export default function WhatsAppDetailHeader({
  channel,
}: {
  channel: WhatsAppChannel;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => router.push("/deploy/whatsapp")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ChevronLeft className="size-4" />
        Back
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[30px] font-semibold leading-[30px] tracking-[-1px] text-foreground">
            {channel.phoneNumber}
          </h1>
          <Badge className="bg-foreground text-background rounded-full text-xs font-semibold px-2 py-0.5">
            Active
          </Badge>
          <Badge className="bg-purple-600 text-white rounded-full text-xs font-semibold px-2 py-0.5">
            {channel.displayName}
          </Badge>
          <Badge className="bg-green-600 text-white rounded-full text-xs font-semibold px-2 py-0.5">
            Approved
          </Badge>
          <Badge className="bg-amber-600 text-white rounded-full text-xs font-semibold px-2 py-0.5">
            {channel.wabaId}
          </Badge>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => router.push("/integrations")}
          >
            <Plug className="size-3.5" />
            Activate integration
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full gap-1.5"
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
