import { z } from "zod";

export const setupSchema = z.object({
  name: z.string().optional(),
  hearAboutUs: z.string().optional(),
  role: z.string().optional(),
  otherRole: z.string().optional(),
});

export type SetupValues = z.infer<typeof setupSchema>;

export const HEAR_ABOUT_US_OPTIONS = [
  { value: "google", label: "Google / Search" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "producthunt", label: "Product Hunt" },
  { value: "friend", label: "Friend or colleague" },
  { value: "youtube", label: "YouTube" },
  { value: "newsletter", label: "Newsletter / Email" },
  { value: "other", label: "Other" },
] as const;

export const ROLE_OPTIONS = [
  { value: "developer", label: "Developer / Engineer" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
  { value: "product", label: "Product Manager" },
  { value: "analyst", label: "Business Analyst" },
  { value: "it-admin", label: "IT Admin" },
  { value: "founder", label: "Founder / Executive" },
  { value: "other", label: "Other" },
] as const;
