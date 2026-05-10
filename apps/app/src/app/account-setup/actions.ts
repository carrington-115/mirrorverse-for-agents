"use server";

import { env } from "@mirrorverse/env/app";

const fetchUrl = env.NEXT_PUBLIC_API_URL;

export interface RegisterUserResponse {
  success: boolean;
  data: { id: string; email: string };
}

export interface UpdateOwnerResponse {
  success: boolean;
  data: { id: string; name: string };
}

export interface CreateOrganizationResponse {
  success: boolean;
  data: { id: string };
}

export interface UpdateOrgAppsResponse {
  success: boolean;
}

export interface UpdateOrgDeployResponse {
  success: boolean;
}

export interface UserProfileResponse {
  success: boolean;
  data: {
    user: { id: string; name: string; email: string };
    organizationMember: {
      role: "owner" | "admin" | "member";
      team: string;
    };
  };
}

interface ErrorBody {
  error?: string;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    if (typeof body.error === "string" && body.error.length > 0) return body.error;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function handleRegisterUser(
  email: string,
  userId: string,
): Promise<RegisterUserResponse> {
  const response = await fetch(`${fetchUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, userId }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to register user"));
  }

  return (await response.json()) as RegisterUserResponse;
}

export async function handleUpdateOwner(
  userId: string,
  name: string,
): Promise<UpdateOwnerResponse> {
  const response = await fetch(`${fetchUrl}/api/v1/auth/update-owner`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to update owner"));
  }

  return (await response.json()) as UpdateOwnerResponse;
}

export async function handleCreateOrganization(
  companyName: string,
  website: string,
  industry: string,
  companySize: string,
  userId: string,
  creatorId: string,
): Promise<CreateOrganizationResponse> {
  const response = await fetch(`${fetchUrl}/api/v1/orgs/${userId}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName,
      website,
      industry,
      companySize,
      userId,
      creatorId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to create organization"));
  }

  return (await response.json()) as CreateOrganizationResponse;
}

export async function handleUpdateOrgApps(
  orgId: string,
  apps: string[],
): Promise<UpdateOrgAppsResponse> {
  const response = await fetch(`${fetchUrl}/api/v1/orgs/${orgId}/default-apps`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ defaultApps: apps }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to update organization apps"));
  }

  return (await response.json()) as UpdateOrgAppsResponse;
}

export async function handleUpdateOrgDeploy(
  orgId: string,
  deploy: string[],
): Promise<UpdateOrgDeployResponse> {
  const response = await fetch(`${fetchUrl}/api/v1/orgs/${orgId}/deployment-strategies`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deploymentStrategies: deploy }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to update organization deploy"));
  }

  return (await response.json()) as UpdateOrgDeployResponse;
}

export async function getUserProfile(userId: string, orgId: string): Promise<UserProfileResponse> {
  const response = await fetch(`${fetchUrl}/api/v1/auth/${userId}/profile?orgId=${orgId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to get user profile"));
  }

  return (await response.json()) as UserProfileResponse;
}
