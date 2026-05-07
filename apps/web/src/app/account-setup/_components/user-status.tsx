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
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-(--sm)">
        <Skeleton className="size-(--4xl) rounded-full" />
        <div className="flex flex-col gap-(--xs)">
          <Skeleton className="h-(--4) w-[143px] rounded-full" />
          <Skeleton className="h-(--3) w-[194px] rounded-full" />
        </div>
      </div>
      <Skeleton className="h-(--4) w-[100px] rounded-full" />
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
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-(--sm)">
        <div className="relative size-(--4xl) rounded-full">
          <Image
            src={imageUrl!}
            alt={name}
            className="h-auto w-full rounded-full object-cover"
            fill
          />
        </div>
        <div>
          <p className="font-medium text-[14px] leading-(--paragraph-small-line-height) text-foreground">
            {name}
          </p>
          <p className="font-normal text-foreground-accent text-[12px] leading-(--paragraph-small-line-height)">
            {email}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-(--sm)">
        {assignedTeam && <Badge variant="outline">{assignedTeam}</Badge>}
        <Badge>{memberStatus === "admin" ? "Admin" : "Member"}</Badge>
      </div>
    </div>
  );
}
