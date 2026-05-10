import type { Metadata, Viewport } from "next";
import { Geist, Roboto } from "next/font/google";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/lib/query/provider";
import { buildMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/seo/site";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  applicationName: siteConfig.name,
  ...buildMetadata({ path: "/" }),
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
