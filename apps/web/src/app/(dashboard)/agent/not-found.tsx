"use client";

import { useState } from "react";
import Link from "next/link";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import CreateAgentSheet from "./_components/CreateAgentSheet";

export default function AgentNotFound() {
  const [createAgentOpen, setCreateAgentOpen] = useState(false);

  return (
    <>
      <div className="flex flex-1 items-center justify-center min-h-[60vh] w-full">
        <Empty className="max-w-sm border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserX className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Agent not found</EmptyTitle>
            <EmptyDescription>
              This agent doesn&apos;t exist or may have been deleted.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/agent">All agents</Link>
            </Button>
            <Button className="w-full" onClick={() => setCreateAgentOpen(true)}>
              Create agent
            </Button>
          </EmptyContent>
        </Empty>
      </div>

      <CreateAgentSheet
        open={createAgentOpen}
        onOpenChange={setCreateAgentOpen}
      />
    </>
  );
}
