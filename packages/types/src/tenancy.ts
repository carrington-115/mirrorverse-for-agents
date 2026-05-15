import type {
  ApiKeyId,
  PlanId,
  SoftDelete,
  Tenanted,
  Timestamps,
  UserId,
  WorkspaceId,
} from "./common";

export type WorkspaceStatus = "active" | "suspended" | "deleted";

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";

/** Top-level tenant. Every other entity is scoped under a workspace. */
export interface Workspace extends Timestamps, SoftDelete {
  readonly id: WorkspaceId;
  readonly slug: string;
  readonly name: string;
  readonly status: WorkspaceStatus;
  readonly planId: PlanId;
  readonly stripeCustomerId: string | null;
  readonly billingEmail: string | null;
  readonly ownerId: UserId;
  readonly website: string | null;
  readonly companySize: CompanySize | null;
  readonly industry: string | null;
  readonly defaultApps: readonly string[];
  readonly defaultDeployChannels: readonly string[];
}

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface WorkspaceMember extends Timestamps {
  readonly id: string;
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly role: WorkspaceRole;
  readonly invitedBy: UserId | null;
  readonly invitedAt: Date | null;
  readonly acceptedAt: Date | null;
}

export type OnboardingStep =
  | "select-role"
  | "verification"
  | "apps"
  | "deploy"
  | "invite-team"
  | "admin"
  | "invitation-accept"
  | "user";

export const OWNER_ONBOARDING_STEPS = [
  "select-role",
  "verification",
  "apps",
  "deploy",
  "invite-team",
  "admin",
] as const satisfies readonly OnboardingStep[];

export const INVITEE_ONBOARDING_STEPS = [
  "invitation-accept",
  "user",
] as const satisfies readonly OnboardingStep[];

export interface UserProfile extends Timestamps {
  readonly id: UserId;
  readonly email: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly defaultWorkspaceId: WorkspaceId | null;
  readonly onboardingStep: OnboardingStep;
  readonly onboardingCompletedAt: Date | null;
  readonly hearAboutUs: string | null;
  readonly role: string | null;
  readonly otherRole: string | null;
}

export type ApiKeyScope =
  | "workflows:read"
  | "workflows:write"
  | "runs:read"
  | "runs:write"
  | "agent:invoke"
  | "billing:read"
  | "*";

export interface ApiKey extends Timestamps, Tenanted {
  readonly id: ApiKeyId;
  readonly name: string;
  readonly hashedKey: string;
  readonly prefix: string;
  readonly scopes: readonly ApiKeyScope[];
  readonly lastUsedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdBy: UserId;
}

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface Invitation extends Timestamps, Tenanted {
  readonly id: string;
  readonly email: string;
  readonly role: WorkspaceRole;
  readonly token: string;
  readonly status: InvitationStatus;
  readonly invitedBy: UserId;
  readonly expiresAt: Date;
  readonly acceptedAt: Date | null;
}

export type Permission =
  | "workspace.delete"
  | "workspace.update"
  | "workspace.transfer"
  | "billing.manage"
  | "billing.view"
  | "member.invite"
  | "member.remove"
  | "member.change-role"
  | "integration.add"
  | "integration.remove"
  | "integration.update"
  | "workflow.create"
  | "workflow.update"
  | "workflow.deploy"
  | "workflow.delete"
  | "chat.create"
  | "chat.delete"
  | "skill.create"
  | "skill.delete";

export const ROLE_PERMISSIONS: Readonly<Record<WorkspaceRole, readonly Permission[]>> = {
  owner: [
    "workspace.delete",
    "workspace.update",
    "workspace.transfer",
    "billing.manage",
    "billing.view",
    "member.invite",
    "member.remove",
    "member.change-role",
    "integration.add",
    "integration.remove",
    "integration.update",
    "workflow.create",
    "workflow.update",
    "workflow.deploy",
    "workflow.delete",
    "chat.create",
    "chat.delete",
    "skill.create",
    "skill.delete",
  ],
  admin: [
    "workspace.update",
    "billing.view",
    "member.invite",
    "member.remove",
    "integration.add",
    "integration.remove",
    "integration.update",
    "workflow.create",
    "workflow.update",
    "workflow.deploy",
    "workflow.delete",
    "chat.create",
    "chat.delete",
    "skill.create",
    "skill.delete",
  ],
  member: [
    "integration.add",
    "integration.update",
    "workflow.create",
    "workflow.update",
    "workflow.deploy",
    "chat.create",
    "skill.create",
  ],
  viewer: [],
};

const ROLE_RANK: Readonly<Record<WorkspaceRole, number>> = {
  owner: 3,
  admin: 2,
  member: 1,
  viewer: 0,
};

export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function roleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canInviteRole(inviterRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  return ROLE_RANK[inviterRole] > ROLE_RANK[targetRole];
}
