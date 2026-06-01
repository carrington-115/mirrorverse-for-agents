import type { BlogPost } from "@/lib/blog-types";
import { BlogCard } from "@/components/blog-card";

interface BlogGridProps {
  posts: BlogPost[];
}

export function BlogGrid({ posts }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-[#737373]">No posts in this category yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="gap-6 md:grid-cols-2 lg:grid-cols-3 grid grid-cols-1">
      {posts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
