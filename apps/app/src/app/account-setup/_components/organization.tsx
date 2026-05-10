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
      className="flex w-full cursor-pointer items-center justify-between px-(--sm) py-(--xs) hover:bg-(--accent-2)/50"
      onClick={orgAction}
    >
      <div className="flex items-center gap-(--xs)">
        <div className="relative size-(--4xl)">
          <Image
            src={OrganizationLogo}
            alt={organizationName}
            className="size-full rounded-full object-contain"
            fill
          />
        </div>
        <div className="flex flex-col items-start gap-(--2xs)">
          <p className="font-medium text-(length:--paragraph-regular-font-size) text-accent-foreground">
            {organizationName}
          </p>
          <p className="text-(length:--paragraph-mini-font-size) text-muted-foreground">{team}</p>
        </div>
      </div>
      <Badge variant={"outline"}>{userRole}</Badge>
    </div>
  );
}
