"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { handleRegisterUser } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export default function UserRole() {
  const { user } = useUser();
  const router = useRouter();
  const [isPendingJoin, startTransitionJoin] = useTransition();
  const [isPendingCreate, startTransitionCreate] = useTransition();

  const handleJoinOrg = async () => {
    if (!user) return;
    try {
      const userId = user.id;
      const email = user.emailAddresses[0].emailAddress;
      console.log("User credentials", userId, email);

      if (!userId) {
        toast.error("Failed to retrieve user ID from Clerk");
        return;
      }
      if (!email) {
        toast.error("Failed to retrieve email from Clerk");
        return;
      }
      startTransitionJoin(async () => {
        await handleRegisterUser(email, userId);
        router.push("/account-setup/join-org");
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateOrg = async () => {
    if (!user) return;
    try {
      const userId = user.id;
      const email = user.emailAddresses[0].emailAddress;

      if (!userId) {
        toast.error("Failed to retrieve user ID from Clerk");
        return;
      }
      if (!email) {
        toast.error("Failed to retrieve email from Clerk");
        return;
      }
      startTransitionCreate(async () => {
        await handleRegisterUser(email, userId);
        router.push("/account-setup/org-setup");
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Card className="w-[430px]">
        <CardHeader>
          <CardTitle>How do you want to continue?</CardTitle>
          <CardDescription>
            Create a new organization to set up your workspace, or join an
            existing one
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-[var(--sm)]">
          <Button
            onClick={handleJoinOrg}
            className={cn("cursor-pointer")}
            variant="default"
          >
            {isPendingJoin && <Loader2 className="h-4 w-4 animate-spin" />}
            Join an organization
          </Button>
          <Button
            onClick={handleCreateOrg}
            className={cn("cursor-pointer")}
            variant="outline"
          >
            {isPendingCreate && <Loader2 className="h-4 w-4 animate-spin" />}
            Create an organization
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
