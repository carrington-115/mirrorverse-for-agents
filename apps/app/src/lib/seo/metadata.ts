import type { Metadata } from "next";
import { siteConfig } from "./site";

export interface BuildMetadataInput {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
}

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image = "/opengraph-image",
  noIndex = false,
  keywords,
}: BuildMetadataInput = {}): Metadata {
  const url = new URL(path, siteConfig.url).toString();
  const fullTitle = title ?? siteConfig.name;
  const ogImage = new URL(image, siteConfig.url).toString();

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      images: [ogImage],
    },
  };
}
