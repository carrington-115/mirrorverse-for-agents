import NavLink from "@/components/nav-link";
import Image from "next/image";
import lightFooterLogo from "@/assets/images/mirrorpilot-icon.svg";
import { linkGroups } from "@/lib/data";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="lg:px-[161px] mt-8 px-4 py-12 md:py-[87px] flex w-full justify-center border-t border-(--border,#e5e5e5) bg-(--unofficial-accent-0,#fafafa)">
      <div className="gap-10 md:flex-row md:items-start md:justify-between md:gap-0 flex w-full max-w-[1440px] flex-col">
        <div className="gap-x-8 gap-y-8 md:flex md:flex-row md:gap-[34px] grid grid-cols-2">
          <div className="flex flex-col items-start gap-[5px]">
            <p className="text-xs font-semibold tracking-wider px-[8px] pb-[4px] text-muted-foreground uppercase">
              Product
            </p>
            {linkGroups.productGroup.map((link) => (
              <NavLink href={link.link} key={link.title}>
                {link.title}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col items-start gap-[5px]">
            <p className="text-xs font-semibold tracking-wider px-[8px] pb-[4px] text-muted-foreground uppercase">
              Resources
            </p>
            {linkGroups.resourcesGroup.map((link) => (
              <NavLink href={link.link} key={link.title}>
                {link.title}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col items-start gap-[5px]">
            <p className="text-xs font-semibold tracking-wider px-[8px] pb-[4px] text-muted-foreground uppercase">
              Use Cases
            </p>
            {linkGroups.useCasesGroup.map((link) => (
              <NavLink href={link.link} key={link.title}>
                {link.title}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col items-start gap-[5px]">
            <p className="text-xs font-semibold tracking-wider px-[8px] pb-[4px] text-muted-foreground uppercase">
              Legal
            </p>
            {linkGroups.legalGroup.map((link) => (
              <NavLink href={link.link} key={link.title}>
                {link.title}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="lg:w-[251px] md:order-first flex flex-col items-start gap-[15px]">
          <Link href="/" className="flex h-[26px] cursor-pointer items-center gap-(--spacing-10)">
            <Image
              src={lightFooterLogo}
              alt="Mirrorverse Logo"
              className="w-[35px] object-contain"
            />
            <p className="text-2xl font-semibold leading-6 text-(--unofficial-foreground-strong,#0b0b0b)">
              Mirrorverse
            </p>
          </Link>
          <p className="text-sm font-normal leading-[20px] text-(--unofficial-foreground-alt,#404040)">
            &copy; Mirrorverse - 2026 - All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
