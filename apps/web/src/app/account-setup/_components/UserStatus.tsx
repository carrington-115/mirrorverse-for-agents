import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface userStatusProps {
  imageUrl: string;
  name: string;
  memberStatus: "admin" | "member";
  email: string;
  assignedTeam?: string;
}

export function UserStatusSkeleton() {
  return (
    <div className="w-full flex items-center justify-between">
      <div className="flex items-center gap-[var(--sm)]">
        <Skeleton className="w-[var(--12)] h-[var(--12)] rounded-full" />
        <div className="flex flex-col gap-[var(--xs)]">
          <Skeleton className="w-[143px] h-[var(--4)] rounded-full" />
          <Skeleton className="w-[194px] h-[var(--3)] rounded-full" />
        </div>
      </div>
      <Skeleton className="w-[100px] h-[var(--4)] rounded-full" />
    </div>
  );
}

export default function UserStatusComponent({
  imageUrl,
  name,
  memberStatus,
  email,
  assignedTeam,
}: userStatusProps) {
  return (
    <div className="flex w-full justify-between items-center">
      <div className="flex items-center gap-[var(--sm)]">
        <div className="w-[48px] h-[48px] rounded-full relative">
          <Image
            src={imageUrl!}
            alt={name}
            className="w-full h-auto object-cover rounded-full"
            fill
          />
        </div>
        <div>
          <p className="text-[14px] font-medium text-foreground leading-[var(--paragraph-small-line-height)]">
            {name}
          </p>
          <p className="text-[12px] font-normal text-foreground-accent leading-[var(--paragraph-small-line-height)]">
            {email}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-[var(--sm)]">
        {assignedTeam && <Badge variant="outline">{assignedTeam}</Badge>}
        <Badge>{memberStatus === "admin" ? "Admin" : "Member"}</Badge>
      </div>
    </div>
  );
}
