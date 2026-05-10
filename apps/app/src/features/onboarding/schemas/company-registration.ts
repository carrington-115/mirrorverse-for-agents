import { z } from "zod";

export const companyRegistrationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  companyName: z.string().min(3, "Company name must be at least 3 characters long"),
  website: z.url("Invalid website"),
  industry: z.string().nonempty("Please select an industry"),
  size: z.number().min(1, "Company size must be greater than 1"),
});

export type CompanyRegistrationValues = z.infer<typeof companyRegistrationSchema>;
