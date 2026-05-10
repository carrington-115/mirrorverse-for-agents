export interface RegisterUserPayload {
  email: string;
  userId: string;
}

export interface RegisterUserResponse {
  success: boolean;
  data: { id: string; email: string };
}

export interface UpdateOwnerPayload {
  userId: string;
  name: string;
}

export interface UpdateOwnerResponse {
  success: boolean;
  data: { id: string; name: string };
}

export interface CreateOrganizationPayload {
  userId: string;
  creatorId: string;
  companyName: string;
  website: string;
  industry: string;
  companySize: string;
}

export interface CreateOrganizationResponse {
  success: boolean;
  data: { id: string };
}

export interface UpdateOrgAppsPayload {
  orgId: string;
  defaultApps: string[];
}

export interface UpdateOrgAppsResponse {
  success: boolean;
}

export interface UpdateOrgDeployPayload {
  orgId: string;
  deploymentStrategies: string[];
}

export interface UpdateOrgDeployResponse {
  success: boolean;
}

export interface UserProfile {
  user: { id: string; name: string; email: string };
  organizationMember: {
    role: "owner" | "admin" | "member";
    team: string;
  };
}

export interface UserProfileResponse {
  success: boolean;
  data: UserProfile;
}
