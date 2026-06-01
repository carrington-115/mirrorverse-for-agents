import Image from "next/image";
import type { BlogContentBlock } from "@/lib/blog-types";

interface BlogPostContentProps {
  content: BlogContentBlock[];
}

export function BlogPostContent({ content }: BlogPostContentProps) {
  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-16 lg:py-24 mx-auto w-full max-w-[760px]">
        <div className="gap-8 flex flex-col text-[15px] leading-[26px] text-[#404040]">
          {content.map((block, i) => {
            if (block.type === "text") {
              return (
                <div key={i} className="gap-4 flex flex-col">
                  {block.paragraphs.map((p, j) => (
                    <p key={j} dangerouslySetInnerHTML={{ __html: p }} />
                  ))}
                </div>
              );
            }

            if (block.type === "heading") {
              const Tag = block.level === 3 ? "h3" : "h2";
              return (
                <Tag
                  key={i}
                  className={
                    block.level === 3
                      ? "text-lg font-semibold tracking-[-0.3px] text-[#0a0a0a]"
                      : "text-2xl font-semibold tracking-[-0.5px] text-[#0a0a0a]"
                  }
                >
                  {block.text}
                </Tag>
              );
            }

            if (block.type === "image") {
              return (
                <figure key={i} className="gap-2 flex flex-col">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#e5e5e5]">
                    <Image
                      src={block.src}
                      alt={block.alt}
                      fill
                      sizes="760px"
                      className="object-cover"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="text-xs text-center text-[#737373]">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            if (block.type === "quote") {
              return (
                <blockquote
                  key={i}
                  className="pl-5 gap-2 flex flex-col border-l-2 border-[#0a0a0a]"
                >
                  <p
                    className="text-[16px] leading-[28px] text-[#0a0a0a] italic"
                    dangerouslySetInnerHTML={{ __html: block.text }}
                  />
                  {block.attribution && (
                    <cite className="text-xs text-[#737373] not-italic">{block.attribution}</cite>
                  )}
                </blockquote>
              );
            }

            if (block.type === "list") {
              return (
                <ul key={i} className="gap-2 pl-5 flex flex-col">
                  {block.items.map((item, j) => (
                    <li key={j} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }

            return null;
          })}
        </div>
      </div>
    </section>
  );
}
