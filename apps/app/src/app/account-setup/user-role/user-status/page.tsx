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
} from "@/app/account-setup/_components/user-status";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getUserProfile } from "../../actions";
import { useOrgSetup } from "@/store/use-org-setup";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import type { UserMetadata } from "@supabase/supabase-js";

export default function UserStatus() {
  const { user, isLoaded } = useSupabaseUser();
  const [profileImg, setProfileImg] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [memberStatus, setMemberStatus] = useState<"admin" | "member">("admin");
  const [assignedTeam, setAssignedTeam] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const orgId = useOrgSetup((state) => state.orgId);

  const userId = user ? user.id : null;

  const fetchUserProfile = useCallback(async () => {
    if (!userId || !orgId) {
      console.warn("fetchUserProfile: missing userId or orgId", { userId, orgId });
      return null;
    }

    try {
      setIsFetching(true);
      setFetchError(null);

      const res = await getUserProfile(userId, orgId);
      const { user: profileUser, organizationMember } = res.data;

      const missing: string[] = [];
      if (!profileUser.name) missing.push("name");
      if (!organizationMember.role) missing.push("role");
      if (!organizationMember.team) missing.push("team");

      if (missing.length > 0) {
        throw new Error(`Incomplete profile data — missing: ${missing.join(", ")}`);
      }

      return {
        name: profileUser.name,
        role: organizationMember.role,
        team: organizationMember.team,
      };
    } catch (error) {
      console.error("fetchUserProfile error:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch user profile";
      setFetchError(message);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, [userId, orgId]);

  useEffect(() => {
    if (!isLoaded || !user || !orgId) return;

    // user_metadata is user-editable — display only, never trust for authorization.
    const metadata: UserMetadata = user.user_metadata;
    const rawFullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
    const rawName = typeof metadata.name === "string" ? metadata.name : "";
    const rawAvatar = typeof metadata.avatar_url === "string" ? metadata.avatar_url : "";
    const rawPicture = typeof metadata.picture === "string" ? metadata.picture : "";

    const fullName = rawFullName.length > 0 ? rawFullName : rawName;
    const avatarUrl = rawAvatar.length > 0 ? rawAvatar : rawPicture;
    const firstName = fullName.split(" ")[0];

    setProfileImg(avatarUrl);
    setName(firstName === undefined ? "" : firstName);
    setEmail(user.email === undefined ? "" : user.email);

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
        <CardContent className="py-10 flex items-center justify-center">
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
          Continue to your dashboard now and start creating agents to automate your business.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fetchError ? (
          <div className="gap-2 py-4 flex flex-col items-center text-center">
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
      <CardFooter className="flex flex-col gap-(--2xs) bg-transparent">
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
