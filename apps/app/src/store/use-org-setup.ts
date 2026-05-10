import { create } from "zustand";

interface orgLinkProps {
  name?: string;
  href?: string;
  active: boolean;
}

interface OrgSetupState {
  organization: orgLinkProps;
  apps: orgLinkProps;
  deploy: orgLinkProps;
  orgId: string;
  setOrganization: (active: boolean) => void;
  setApps: (active: boolean) => void;
  setDeploy: (active: boolean) => void;
  setOrgId: (orgId: string) => void;
}

export const useOrgSetup = create<OrgSetupState>()((set) => ({
  // state
  organization: {
    name: "Organization",
    href: "/account-setup/org-setup",
    active: false,
  },
  apps: {
    name: "Apps",
    href: "/account-setup/org-setup/apps-setup",
    active: false,
  },
  deploy: {
    name: "Deploy",
    href: "/account-setup/org-setup/org-deploy",
    active: false,
  },
  orgId: "",

  // actions
  setOrganization: (active: boolean) =>
    set((state) => ({
      organization: { ...state.organization, active },
    })),

  setApps: (active: boolean) =>
    set((state) => ({
      apps: { ...state.apps, active },
    })),

  setDeploy: (active: boolean) =>
    set((state) => ({
      deploy: { ...state.deploy, active },
    })),

  setOrgId: (orgId: string) =>
    set((_state) => ({
      orgId,
    })),
}));
