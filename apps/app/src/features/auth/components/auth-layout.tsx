import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import logoLight from "@/assets/mirrorpilot-icon.svg";
import logoDark from "@/assets/mirrorpilot-icon-dark.svg";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col">
      <header className="px-8 py-6 flex items-center">
        <Link href="https://mirrro.io">
          <div className="flex h-auto">
            <Image src={logoLight} alt="Mirrro" className="block h-auto w-[35px] dark:hidden" />
            <Image src={logoDark} alt="Mirrro" className="hidden h-auto w-[35px] dark:block" />
            <p className="font-semibold text-[24px]">Mirrorverse</p>
          </div>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}
