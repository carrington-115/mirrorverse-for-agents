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
}

export type WorkspaceRole = "owner" | "admin" | "member";

export interface WorkspaceMember extends Timestamps {
  readonly id: string;
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly role: WorkspaceRole;
  readonly invitedBy: UserId | null;
  readonly invitedAt: Date | null;
  readonly acceptedAt: Date | null;
}

/** App-level user profile that mirrors / extends the Supabase auth user. */
export interface UserProfile extends Timestamps {
  readonly id: UserId;
  readonly email: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly defaultWorkspaceId: WorkspaceId | null;
}

export type ApiKeyScope =
  | "workflows:read"
  | "workflows:write"
  | "runs:read"
  | "runs:write"
  | "agent:invoke"
  | "billing:read"
  | "*";

/** API token a user creates to call our HTTP API from outside the app. */
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
