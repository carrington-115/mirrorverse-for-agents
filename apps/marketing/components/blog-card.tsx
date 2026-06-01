import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { BlogPost } from "@/lib/blog-types";

interface BlogCardProps {
  post: BlogPost;
}

const categoryColors: Record<BlogPost["category"], string> = {
  Insights: "bg-blue-50 text-blue-600",
  "Use Cases": "bg-green-50 text-green-600",
  Company: "bg-violet-50 text-violet-600",
};

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group hover:shadow-sm flex flex-col overflow-hidden rounded-3xl border border-[#e5e5e5] bg-[#fafafa] transition-shadow"
    >
      {/* Cover image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1188px) 50vw, 400px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      {/* Card body */}
      <div className="gap-3 p-6 flex flex-1 flex-col">
        {/* Category badge */}
        <span
          className={`px-2.5 py-1 text-xs font-semibold w-fit rounded-full ${categoryColors[post.category]}`}
        >
          {post.category}
        </span>

        {/* Title + description */}
        <div className="gap-2 flex flex-col">
          <h3 className="text-base font-semibold line-clamp-2 leading-[1.3] tracking-[-0.2px] text-[#0a0a0a] transition-colors group-hover:text-[#404040]">
            {post.title}
          </h3>
          <p className="text-sm line-clamp-3 leading-[22px] text-[#737373]">{post.description}</p>
        </div>

        {/* Author + meta */}
        <div className="gap-3 pt-4 mt-auto flex items-center border-t border-[#e5e5e5]">
          <div className="size-7 relative shrink-0 overflow-hidden rounded-full">
            <Image
              src={post.author.imageUrl}
              alt={post.author.name}
              fill
              sizes="28px"
              className="object-cover"
            />
          </div>
          <span className="text-xs font-medium text-[#0a0a0a]">{post.author.name}</span>
          <span className="text-[#e5e5e5]">·</span>
          <span className="text-xs text-[#737373]">{post.date}</span>
          <span className="text-[#e5e5e5]">·</span>
          <span className="gap-1 text-xs flex items-center text-[#737373]">
            <Clock size={11} />
            {post.readTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
