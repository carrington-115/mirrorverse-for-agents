"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { OrganizationProps } from "@/lib/types";

export default function OrganizationElement({
  OrganizationLogo,
  organizationName,
  team,
  userRole,
  orgAction,
}: OrganizationProps) {
  return (
    <div
      className="w-full flex items-center justify-between px-[var(--sm)] py-[var(--xs)] hover:bg-[var(--accent-2)]/50 cursor-pointer"
      onClick={orgAction}
    >
      <div className="flex items-center gap-[var(--xs)]">
        <div className="relative h-[48px] w-[48px]">
          <Image
            src={OrganizationLogo}
            alt={organizationName}
            className="w-full h-full object-contain rounded-full"
            fill
          />
        </div>
        <div className="flex flex-col items-start gap-[var(--2xs)]">
          <p className="text-[var(--paragraph-regular-font-size)] font-medium text-accent-foreground">
            {organizationName}
          </p>
          <p className="text-[var(--paragraph-mini-font-size)] text-muted-foreground">
            {team}
          </p>
        </div>
      </div>
      <Badge variant={"outline"}>{userRole}</Badge>
    </div>
  );
}
