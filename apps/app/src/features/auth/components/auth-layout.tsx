import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col">
      <header className="px-8 py-6 flex items-center">
        <Link href="https://mirrro-ai-website.vercel.app/">
          <div className="flex h-auto w-[102px]">
            <Image src={logoLight} alt="Mirrro" className="block h-auto w-full dark:hidden" />
            <Image src={logoDark} alt="Mirrro" className="hidden h-auto w-full dark:block" />
          </div>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}
