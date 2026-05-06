"use client";

import { useState } from "react";
import { LayoutPanelTop, Pause, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Agent } from "@/lib/types";

export default function AgentDetailHeader({ agent }: { agent: Agent }) {
  const [name, setName] = useState(agent.name);
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center justify-between gap-[var(--md)] w-full">
      <div className="flex items-center gap-[var(--xs)]">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditing(false);
              if (e.key === "Escape") {
                setName(agent.name);
                setEditing(false);
              }
            }}
            className="text-[length:var(--heading-2-font-size)] font-semibold leading-[var(--heading-2-line-height)] tracking-[var(--heading-2-letter-spacing)] text-foreground bg-transparent border-b border-border outline-none min-w-[360px]"
          />
        ) : (
          <h1 className="text-[length:var(--heading-2-font-size)] font-semibold leading-[var(--heading-2-line-height)] tracking-[var(--heading-2-letter-spacing)] text-foreground">
            {name}
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-6 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setEditing(true)}
          aria-label="Edit agent name"
        >
          <Pencil className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-[var(--md)] shrink-0">
        <Button
          variant="secondary"
          className="rounded-full gap-[var(--xs)] min-h-9"
          onClick={() => toast.info("Template library coming soon")}
        >
          <LayoutPanelTop className="size-4" />
          Use template
        </Button>
        <Button
          variant="outline"
          className="rounded-full gap-[var(--xs)] min-h-9 shadow-xs"
          onClick={() =>
            toast.info(
              agent.status === "paused"
                ? "Resume agent coming soon"
                : "Pause agent coming soon",
            )
          }
        >
          <Pause className="size-4" />
          {agent.status === "paused" ? "Resume agent" : "Pause agent"}
        </Button>
      </div>
    </div>
  );
}
