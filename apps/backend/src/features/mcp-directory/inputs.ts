import { z } from "zod";

export const listInput = z.object({
  category: z.string().min(1).optional(),
  type: z.enum(["remote", "local"]).optional(),
  search: z.string().min(1).max(120).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const getBySlugInput = z.object({
  slug: z.string().min(1),
});

export const byCategoryInput = z.object({
  category: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListInput = z.infer<typeof listInput>;
export type GetBySlugInput = z.infer<typeof getBySlugInput>;
export type ByCategoryInput = z.infer<typeof byCategoryInput>;
