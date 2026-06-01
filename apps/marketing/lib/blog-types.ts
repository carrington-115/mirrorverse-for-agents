export interface BlogAuthor {
  name: string;
  imageUrl: string;
}

export type BlogContentBlock =
  | { type: "text"; paragraphs: string[] }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "heading"; text: string; level?: 2 | 3 }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "list"; items: string[] };

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  category: "Insights" | "Use Cases" | "Company";
  title: string;
  description: string;
  coverImage: string;
  readTime: string;
  date: string;
  author: BlogAuthor;
  content: BlogContentBlock[];
  faqs?: BlogFaq[];
}
