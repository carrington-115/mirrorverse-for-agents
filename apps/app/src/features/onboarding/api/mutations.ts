"use client";

import { useMutation } from "@tanstack/react-query";
import { toApiError } from "@/lib/http/client";
import {
  createOrganization,
  registerUser,
  updateOrgApps,
  updateOrgDeploy,
  updateOwner,
} from "./endpoints";

export function useRegisterUserMutation() {
  return useMutation({
    mutationFn: registerUser,
    onError: (err) => toApiError(err, "Failed to register user"),
  });
}

export function useUpdateOwnerMutation() {
  return useMutation({
    mutationFn: updateOwner,
    onError: (err) => toApiError(err, "Failed to update owner"),
  });
}

export function useCreateOrganizationMutation() {
  return useMutation({
    mutationFn: createOrganization,
    onError: (err) => toApiError(err, "Failed to create organization"),
  });
}

export function useUpdateOrgAppsMutation() {
  return useMutation({
    mutationFn: updateOrgApps,
    onError: (err) => toApiError(err, "Failed to update organization apps"),
  });
}

export function useUpdateOrgDeployMutation() {
  return useMutation({
    mutationFn: updateOrgDeploy,
    onError: (err) => toApiError(err, "Failed to update deployment strategies"),
  });
}
