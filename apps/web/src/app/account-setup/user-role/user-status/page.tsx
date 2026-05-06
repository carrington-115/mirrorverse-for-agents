"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Suspense, useEffect, useState, useCallback } from "react";
import UserStatusComponent, {
  UserStatusSkeleton,
} from "@/app/account-setup/_components/UserStatus";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getUserProfile } from "../../actions";
import { useOrgSetup } from "@/store/use-org-setup";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function UserStatus() {
  const { user, isLoaded } = useUser(); // ← also pull isLoaded
  const [profileImg, setProfileImg] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [memberStatus, setMemberStatus] = useState<"admin" | "member">("admin");
  const [assignedTeam, setAssignedTeam] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const orgId = useOrgSetup((state) => state.orgId);

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id || !orgId) {
      console.warn("fetchUserProfile: missing user.id or orgId", {
        userId: user?.id,
        orgId,
      });
      return null;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const res = await getUserProfile(user.id, orgId);

      const name = res?.data?.user?.name;
      const role = res?.data?.organizationMember?.role;
      const team = res?.data?.organizationMember?.team;

      if (!name || !role || !team) {
        console.error("Missing fields in response:", { name, role, team });
        throw new Error(
          `Incomplete profile data — missing: ${[
            !name && "name",
            !role && "role",
            !team && "team",
          ]
            .filter(Boolean)
            .join(", ")}`,
        );
      }

      return { name, role, team };
    } catch (error: any) {
      console.error("fetchUserProfile error:", error);
      setFetchError(error?.message || "Failed to fetch user profile");
      return null;
    } finally {
      setIsFetching(false);
    }
  }, [user?.id, orgId]);

  useEffect(() => {
    if (!isLoaded || !user || !orgId) return;

    setProfileImg(user.imageUrl);
    setName(user.firstName ?? "");
    setEmail(user.emailAddresses[0].emailAddress);

    fetchUserProfile().then((profile) => {
      if (!profile) return;
      const { name, role, team } = profile;
      setName(name);
      setMemberStatus(role === "owner" ? "admin" : "member");
      setAssignedTeam(team === "Admin" ? "" : team);
    });
  }, [isLoaded, user, orgId, fetchUserProfile]);

  if (!isLoaded || isFetching) {
    return (
      <Card className="w-[429px]">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="animate-spin h-10 w-10" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[429px]">
      <CardHeader>
        <CardTitle>You have successfully joined Mirrro</CardTitle>
        <CardDescription>
          Continue to your dashboard now and start creating agents to automate
          your business.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fetchError ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-red-500">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchUserProfile}>
              Retry
            </Button>
          </div>
        ) : (
          <Suspense fallback={<UserStatusSkeleton />}>
            <UserStatusComponent
              imageUrl={profileImg || "/dummy.png"}
              name={name}
              memberStatus={memberStatus}
              email={email}
              assignedTeam={assignedTeam}
            />
          </Suspense>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-[var(--2xs)] bg-transparent">
        <Link
          href={`/dashboard?orgId=${orgId}`}
          className={buttonVariants({ className: "w-full cursor-pointer" })}
        >
          Go to Dashboard
        </Link>
        <Link
          href={`/account-setup/org-setup/invite-team-members?orgId=${orgId}`}
          className={buttonVariants({
            variant: "outline",
            className: "w-full cursor-pointer",
          })}
        >
          <Plus /> Invite team members
        </Link>
      </CardFooter>
    </Card>
  );
}
