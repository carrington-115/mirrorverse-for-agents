import type { z } from "zod";

const MAX_ISSUES = 20;

export function summarizeZodIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, MAX_ISSUES)
    .map((issue) => `- ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}
