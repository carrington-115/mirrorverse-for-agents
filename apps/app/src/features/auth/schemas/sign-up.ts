import { z } from "zod";

export const signUpSchema = z.object({
  email: z.email("Invalid email"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
