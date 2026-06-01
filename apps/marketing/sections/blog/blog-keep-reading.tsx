"use client";

import type { BlogPost } from "@/lib/blog-types";
import { BlogCard } from "@/components/blog-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface BlogKeepReadingProps {
  posts: BlogPost[];
}

export function BlogKeepReading({ posts }: BlogKeepReadingProps) {
  if (posts.length === 0) return null;

  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <h2 className="font-semibold mb-10 lg:text-[30px] text-[24px] tracking-[-0.5px] text-[#0a0a0a]">
          Keep reading
        </h2>

        <Carousel opts={{ align: "start", loop: false }} className="w-full">
          <CarouselContent className="-ml-4">
            {posts.map((post) => (
              <CarouselItem key={post.slug} className="pl-4 md:basis-1/2 lg:basis-1/3 basis-full">
                <BlogCard post={post} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {posts.length > 1 && (
            <div className="mt-8 gap-2 flex items-center">
              <CarouselPrevious className="translate-y-0 static" />
              <CarouselNext className="translate-y-0 static" />
            </div>
          )}
        </Carousel>
      </div>
    </section>
  );
}
