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

export default function ChannelEmptyState({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: ChannelEmptyStateProps) {
  return (
    <div className="flex w-fit items-center justify-center mt-4">
      <Empty className="border border-border rounded-xl w-[448px] min-h-[277px] px-8 py-8">
        <EmptyHeader>
          <EmptyTitle className="text-[16px] font-medium leading-[24px] text-foreground">
            {title}
          </EmptyTitle>
          <EmptyDescription className="text-center text-[14px] leading-[20px]">
            {description}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2 justify-center">
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
