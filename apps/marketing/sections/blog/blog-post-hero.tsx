import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import type { BlogPost } from "@/lib/blog-types";

interface BlogPostHeroProps {
  post: BlogPost;
}

const categoryColors: Record<BlogPost["category"], string> = {
  Insights: "bg-blue-50 text-blue-600",
  "Use Cases": "bg-green-50 text-green-600",
  Company: "bg-violet-50 text-violet-600",
};

export function BlogPostHero({ post }: BlogPostHeroProps) {
  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 pb-16 lg:pb-20 lg:pt-[160px] mx-auto max-w-[1188px] pt-[140px]">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="gap-1.5 text-sm inline-flex items-center text-[#737373] transition-colors hover:text-[#0a0a0a]"
          >
            <ArrowLeft size={14} />
            All posts
          </Link>
        </div>

        {/* Category badge */}
        <div className="mb-4">
          <span
            className={`px-3 py-1 text-xs font-semibold inline-flex items-center rounded-full ${categoryColors[post.category]}`}
          >
            {post.category}
          </span>
        </div>

        {/* Title + description */}
        <div className="mb-8 max-w-[760px]">
          <h1 className="font-semibold mb-4 md:text-[40px] lg:text-[48px] text-[32px] leading-[1.1] tracking-[-1px] text-[#0a0a0a]">
            {post.title}
          </h1>
          <p className="text-lg font-normal leading-[27px] text-[#404040]">{post.description}</p>
        </div>

        {/* Author + meta row */}
        <div className="gap-4 mb-12 flex items-center">
          <div className="size-9 relative shrink-0 overflow-hidden rounded-full">
            <Image
              src={post.author.imageUrl}
              alt={post.author.name}
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <div className="gap-0.5 flex flex-col">
            <span className="text-sm font-medium text-[#0a0a0a]">{post.author.name}</span>
            <div className="gap-2 text-xs flex items-center text-[#737373]">
              <span>{post.date}</span>
              <span>·</span>
              <span className="gap-1 flex items-center">
                <Clock size={11} />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>

        {/* Cover image */}
        <div className="shadow-sm relative aspect-[16/7] w-full overflow-hidden rounded-2xl border border-[#e5e5e5]">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 1188px) 100vw, 1188px"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
