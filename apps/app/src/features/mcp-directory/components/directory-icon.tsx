"use client";

import { useState } from "react";
import Image from "next/image";
import { Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryEntry } from "../api/types";

interface DirectoryIconProps {
  entry: Pick<DirectoryEntry, "displayName" | "authorUrl" | "documentationUrl" | "supportUrl">;
  className?: string;
  size?: number;
}

function pickHostUrl(entry: DirectoryIconProps["entry"]): string | null {
  return entry.authorUrl ?? entry.documentationUrl ?? entry.supportUrl ?? null;
}

function faviconUrl(target: string, size: number): string {
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(target)}&size=${size}`;
}

export function DirectoryIcon({ entry, className, size = 24 }: DirectoryIconProps) {
  const [errored, setErrored] = useState(false);
  const host = pickHostUrl(entry);
  const src = host ? faviconUrl(host, Math.max(size * 2, 48)) : null;

  if (!src || errored) {
    return <Plug className={cn("text-muted-foreground", className)} size={size} />;
  }

  return (
    <Image
      src={src}
      alt={entry.displayName}
      width={size}
      height={size}
      unoptimized
      className={cn("object-contain", className)}
      onError={() => setErrored(true)}
    />
  );
}
