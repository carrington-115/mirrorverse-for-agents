import type { BlogPost } from "@/lib/blog-types";
import aiAgentsCustomerSupport from "./posts/ai-agents-customer-support";

// To add a new post:
// 1. Create a new file in ./posts/<your-slug>.ts following the BlogPost interface
// 2. Import it here and add it to the array (newest first)
export const blogPosts: BlogPost[] = [aiAgentsCustomerSupport];

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return blogPosts.find((p) => p.slug === slug) ?? null;
}

export function getRecentPosts(excludeSlug?: string, limit = 5): BlogPost[] {
  return blogPosts.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}
