"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PhoneNumber } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PhoneDetailHeader({ phone }: { phone: PhoneNumber }) {
  const router = useRouter();
  const [label, setLabel] = useState(phone.description);
  const [editingLabel, setEditingLabel] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "gap-2 top-0 py-3 sticky z-10 flex flex-col bg-background",
        isScrolled && "border-b border-border",
      )}
    >
      <button
        onClick={() => router.push("/deploy/phone")}
        className="gap-1 text-sm flex w-fit items-center text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back
      </button>

      <div className="gap-2 flex flex-wrap items-center">
        <h1 className="font-semibold text-[30px] leading-[30px] tracking-[-1px] text-foreground">
          {phone.number}
        </h1>
        {phone.verificationStatus === "pending" ? (
          <Badge className="bg-yellow-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Pending verification
          </Badge>
        ) : (
          <Badge className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Verified
          </Badge>
        )}
        <Badge className="bg-purple-500 text-white text-xs font-semibold px-2 py-0.5 gap-1 flex items-center rounded-full">
          <Bot className="size-3" />
          {phone.purpose}
        </Badge>
        <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 rounded-full">
          {phone.callType}
        </Badge>
      </div>

      <div className="gap-2 flex items-center">
        {editingLabel ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingLabel(false)}
            className="text-lg font-medium border-b border-border bg-transparent text-foreground outline-none"
          />
        ) : (
          <span className="text-lg font-medium text-foreground">{label}</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full bg-secondary hover:bg-secondary/80"
          onClick={() => setEditingLabel(true)}
        >
          <Pencil className="size-4" />
        </Button>
      </div>
    </div>
  );
}
