import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const signUpSchema = z
  .object({
    email: z.email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const companyRegistrationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  companyName: z
    .string()
    .min(3, "Company name must be at least 3 characters long"),
  website: z.url("Invalid website"),
  industry: z.string().nonempty("Please select an industry"),
  size: z.number().min(1, "Company size must be greater than 1"),
});

export const appsSetupSchema = z.object({
  apps: z.array(z.string()).min(1, "Please select at least one app"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
