import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";

export function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-between">
      <div className="justify-left flex w-full">
        <div className="h-auto w-[102px] pt-[26px] pl-[16px]">
          <Link href="https://mirrro-ai-website.vercel.app/">
            <Image src={logoLight} alt="Mirrro" className="block h-auto w-full dark:hidden" />
            <Image src={logoDark} alt="Mirrro" className="hidden h-auto w-full dark:block" />
          </Link>
        </div>
      </div>
      <div className="flex w-full items-center justify-center">{children}</div>
      <div className="mb-[60px] flex w-full items-center justify-center">
        <p className="text-sm font-normal max-w-[350px] text-center leading-(--body-1-line-height) text-muted-foreground">
          By clicking continue, you agree to our&nbsp;
          <Link
            href="https://www.notion.so/Mirrroverse-Privacy-Policy-05cef81cb4c944a5ab6cb13d034dd873?source=copy_link"
            className="text-primary underline"
            target="_blank"
          >
            Terms of Service
          </Link>
          &nbsp;and&nbsp;
          <Link
            href="https://www.notion.so/Mirrroverse-Privacy-Policy-05cef81cb4c944a5ab6cb13d034dd873?source=copy_link"
            className="text-primary underline"
            target="_blank"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
