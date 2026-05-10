import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Invalid email"),
});

export type SignInValues = z.infer<typeof signInSchema>;
