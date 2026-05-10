"use client";

import OrgNavComponent from "@/app/account-setup/_components/org-nav";
import { NavigationPosition } from "@/lib/types";
import { useOrgSetup } from "@/store/use-org-setup";
import { usePathname } from "next/navigation";

export default function OrganizationSetupLayout({ children }: { children: React.ReactNode }) {
  const { organization, apps, deploy } = useOrgSetup();
  const pathname = usePathname();
  const navBtns: NavigationPosition[] = [
    {
      name: "Organization",
      href: "/account-setup/org-setup",
      active: organization.active,
    },
    {
      name: "Apps",
      href: "/account-setup/org-setup/apps-setup",
      active: apps.active,
    },
    {
      name: "Deploy",
      href: "/account-setup/org-setup/org-deploy",
      active: deploy.active,
    },
  ];
  return (
    <div>
      {pathname !== "/account-setup/org-setup/invite-team-members" && (
        <OrgNavComponent navBtns={navBtns} />
      )}
      <div>{children}</div>
    </div>
  );
}
