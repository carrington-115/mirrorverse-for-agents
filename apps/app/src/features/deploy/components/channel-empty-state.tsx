"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface ChannelEmptyStateProps {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}

export function ChannelEmptyState({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: ChannelEmptyStateProps) {
  return (
    <div className="mt-4 flex w-fit items-center justify-center">
      <Empty className="px-8 py-8 min-h-[277px] w-[448px] rounded-xl border border-border">
        <EmptyHeader>
          <EmptyTitle className="font-medium text-[16px] leading-[24px] text-foreground">
            {title}
          </EmptyTitle>
          <EmptyDescription className="text-center text-[14px] leading-[20px]">
            {description}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="gap-2 flex justify-center">
            <Button onClick={onPrimary}>
              <Plus className="size-4" />
              {primaryLabel}
            </Button>
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
