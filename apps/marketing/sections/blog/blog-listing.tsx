"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/blog-types";
import { BlogCategories } from "./blog-categories";
import { BlogGrid } from "./blog-grid";

interface BlogListingProps {
  posts: BlogPost[];
}

export function BlogListing({ posts }: BlogListingProps) {
  const [activeCategory, setActiveCategory] = useState<BlogPost["category"] | "All">("All");

  const filtered =
    activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);

  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <div className="mb-10">
          <BlogCategories active={activeCategory} onChange={setActiveCategory} />
        </div>
        <BlogGrid posts={filtered} />
      </div>
    </section>
  );
}
