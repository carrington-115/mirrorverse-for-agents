import { authedClient } from "@/lib/http/client";
import type {
  CreateOrganizationPayload,
  CreateOrganizationResponse,
  RegisterUserPayload,
  RegisterUserResponse,
  UpdateOrgAppsPayload,
  UpdateOrgAppsResponse,
  UpdateOrgDeployPayload,
  UpdateOrgDeployResponse,
  UpdateOwnerPayload,
  UpdateOwnerResponse,
  UserProfileResponse,
} from "./types";

export async function registerUser(payload: RegisterUserPayload): Promise<RegisterUserResponse> {
  return authedClient.post("api/v1/auth/register", { json: payload }).json<RegisterUserResponse>();
}

export async function updateOwner(payload: UpdateOwnerPayload): Promise<UpdateOwnerResponse> {
  return authedClient
    .patch("api/v1/auth/update-owner", { json: payload })
    .json<UpdateOwnerResponse>();
}

export async function createOrganization(
  payload: CreateOrganizationPayload,
): Promise<CreateOrganizationResponse> {
  const { userId, ...body } = payload;
  return authedClient
    .post(`api/v1/orgs/${userId}/create`, { json: { userId, ...body } })
    .json<CreateOrganizationResponse>();
}

export async function updateOrgApps(payload: UpdateOrgAppsPayload): Promise<UpdateOrgAppsResponse> {
  const { orgId, defaultApps } = payload;
  return authedClient
    .patch(`api/v1/orgs/${orgId}/default-apps`, { json: { defaultApps } })
    .json<UpdateOrgAppsResponse>();
}

export async function updateOrgDeploy(
  payload: UpdateOrgDeployPayload,
): Promise<UpdateOrgDeployResponse> {
  const { orgId, deploymentStrategies } = payload;
  return authedClient
    .patch(`api/v1/orgs/${orgId}/deployment-strategies`, { json: { deploymentStrategies } })
    .json<UpdateOrgDeployResponse>();
}

export async function fetchUserProfile(
  userId: string,
  orgId: string,
): Promise<UserProfileResponse> {
  return authedClient
    .get(`api/v1/auth/${userId}/profile`, { searchParams: { orgId } })
    .json<UserProfileResponse>();
}
