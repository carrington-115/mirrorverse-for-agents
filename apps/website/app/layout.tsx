import type { Metadata } from "next";
import { Roboto, Geist } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mirrro AI",
  description:
    "Unifying Sales, Marketing, and Support teams in the modern Era under one AI and one memory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} antialiased`}>
        <>
          <NavBar />
        </>
        {children}
      </body>
    </html>
  );
}
