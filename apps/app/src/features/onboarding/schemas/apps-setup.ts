import { z } from "zod";

export const appsSetupSchema = z.object({
  apps: z.array(z.string()).min(1, "Please select at least one app"),
});

export type AppsSetupValues = z.infer<typeof appsSetupSchema>;
