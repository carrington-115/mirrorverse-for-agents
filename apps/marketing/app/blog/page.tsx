import type { Metadata } from "next";
import { blogPosts } from "@/content/blog";
import { BlogHero, BlogListing } from "@/sections/blog";

export const metadata: Metadata = {
  title: "Blog — Mirrorverse",
  description: "Insights, use cases, and company updates from the Mirrorverse team.",
};

export default function BlogPage() {
  return (
    <>
      <BlogHero />
      <BlogListing posts={blogPosts} />
    </>
  );
}
