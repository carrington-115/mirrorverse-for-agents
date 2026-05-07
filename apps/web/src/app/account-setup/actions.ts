"use server";

import { env } from "@mirrorverse/env/web";

const fetchUrl = env.NEXT_PUBLIC_API_URL;

export const handleRegisterUser = async (email: string, userId: string) => {
  try {
    const response = await fetch(`${fetchUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to register user");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const handleUpdateOwner = async (userId: string, name: string) => {
  try {
    const response = await fetch(`${fetchUrl}/api/v1/auth/update-owner`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Update owner server response:", errorData);
      throw new Error(errorData?.error || "Failed to update owner");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating owner:", error);
    throw error;
  }
};

export const handleCreateOrganization = async (
  companyName: string,
  website: string,
  industry: string,
  companySize: string,
  userId: string,
  creatorId: string,
) => {
  try {
    const response = await fetch(`${fetchUrl}/api/v1/orgs/${userId}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      const errorData = await response.json();
      console.error("Create org server response:", errorData);
      throw new Error(errorData?.error || "Failed to create organization");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating organization:", error);
    throw error;
  }
};

export const handleUpdateOrgApps = async (orgId: string, apps: string[]) => {
  try {
    const response = await fetch(`${fetchUrl}/api/v1/orgs/${orgId}/default-apps`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ defaultApps: apps }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Update org apps server response:", errorData);
      throw new Error(errorData?.error || "Failed to update organization apps");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating organization apps:", error);
    throw error;
  }
};

export const handleUpdateOrgDeploy = async (orgId: string, deploy: string[]) => {
  try {
    const response = await fetch(`${fetchUrl}/api/v1/orgs/${orgId}/deployment-strategies`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deploymentStrategies: deploy }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Update org deploy server response:", errorData);
      throw new Error(errorData?.error || "Failed to update organization deploy");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating organization deploy:", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string, orgId: string) => {
  try {
    const response = await fetch(`${fetchUrl}/api/v1/auth/${userId}/profile?orgId=${orgId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Get user profile server response:", errorData);
      throw new Error(errorData?.error || "Failed to get user profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};
