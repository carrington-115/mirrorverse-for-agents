"use client";

import OrganizationElement from "../_components/Organization";
import { orgSample } from "@/lib/data";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OrganizationProps } from "@/lib/types";

export default function JoinOrganization() {
  const router = useRouter();

  const handleJoinOrganization = () => {
    router.push("/account-setup/org-setup");
  };

  return (
    <div>
      <Card className="w-[430px] bg-[var(--accent-0)]">
        <CardHeader>
          <CardTitle>Join an organization</CardTitle>
          <CardDescription>Select an organization to join</CardDescription>
        </CardHeader>
        <CardContent className="!px-0">
          {orgSample.map((org) => (
            <ComposedOrgComponent key={org.organizationName} {...org} />
          ))}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full cursor-pointer"
            variant={"outline"}
            onClick={handleJoinOrganization}
          >
            <CirclePlus /> Create new organization
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

const ComposedOrgComponent = ({
  OrganizationLogo,
  organizationName,
  team,
  userRole,
  orgAction,
}: OrganizationProps) => {
  return (
    <Dialog>
      <DialogTrigger className="w-full">
        <div className="w-full">
          <OrganizationElement
            OrganizationLogo={OrganizationLogo}
            organizationName={organizationName}
            team={team}
            userRole={userRole}
            orgAction={orgAction}
          />
          <Separator orientation="horizontal" />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Do you want to proceed?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you absolutely sure you want to
            join this organization?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant={"outline"} onClick={orgAction}>
            Cancel
          </Button>
          <Button variant={"default"} onClick={orgAction}>
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
