import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { blogPosts, getBlogPostBySlug, getRecentPosts } from "@/content/blog";
import { BlogPostHero, BlogPostContent, BlogKeepReading, BlogPostFaqs } from "@/sections/blog";
import { CtaBanner } from "@/components/cta-banner";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Mirrorverse Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) notFound();

  const recentPosts = getRecentPosts(slug, 5);

  return (
    <>
      <BlogPostHero post={post} />
      <BlogPostContent content={post.content} />
      <BlogKeepReading posts={recentPosts} />
      {post.faqs && post.faqs.length > 0 && <BlogPostFaqs faqs={post.faqs} />}
      <CtaBanner
        title="Start automating today — it's free"
        subtitle="Join thousands of teams using Mirrorverse to eliminate busywork and scale without limits."
        primaryLabel="Try for free"
        primaryHref="#"
        secondaryLabel="Book a demo"
        secondaryHref="https://cal.com/frumark/mirrroagents"
      />
    </>
  );
}
