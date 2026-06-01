"use client";

import { cn } from "@/lib/utils";
import type { BlogPost } from "@/lib/blog-types";

const categories: Array<BlogPost["category"] | "All"> = ["All", "Insights", "Use Cases", "Company"];

interface BlogCategoriesProps {
  active: BlogPost["category"] | "All";
  onChange: (category: BlogPost["category"] | "All") => void;
}

export function BlogCategories({ active, onChange }: BlogCategoriesProps) {
  return (
    <div className="gap-2 flex flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-full border transition-colors",
            active === cat
              ? "text-white border-[#0a0a0a] bg-[#0a0a0a]"
              : "bg-white border-[#e5e5e5] text-[#404040] hover:border-[#0a0a0a] hover:text-[#0a0a0a]",
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
