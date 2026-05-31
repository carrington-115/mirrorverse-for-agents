import NavLink from "@/components/nav-link";
import Image from "next/image";
import lightFooterLogo from "@/assets/images/light-logo.svg";
import darkFooterLogo from "@/assets/images/Dark mode.svg";
import { linkGroups } from "@/lib/data";

export function Footer() {
  return (
    <footer className="md:py-[87px] lg:px-[161px] flex w-full justify-center border-t border-(--border,#e5e5e5) bg-(--unofficial-accent-0,#fafafa) px-(--spacing-16) py-(--spacing-64)">
      <div className="md:flex-row md:gap-0 flex w-full max-w-[1440px] flex-col items-start justify-between gap-(--spacing-32)">
        <div className="lg:w-[251px] flex flex-col items-start gap-(--spacing-16)">
          <div className="relative h-[26px] w-[132px]">
            <Image
              src={lightFooterLogo}
              alt="Mirrorverse Logo"
              fill
              className="object-contain dark:hidden"
            />
            <Image
              src={darkFooterLogo}
              alt="Mirrorverse Logo"
              fill
              className="hidden object-contain dark:block"
            />
          </div>
          <p className="text-sm font-normal leading-[20px] text-(--unofficial-foreground-alt,#404040)">
            &copy; Mirrorverse - 2026 - All rights reserved
          </p>
        </div>

        <div className="md:gap-[34px] flex flex-row items-start gap-(--spacing-32)">
          <div className="flex flex-col items-start gap-[5px]">
            {linkGroups.productGroup.map((link) => (
              <NavLink href={link.link} key={link.title}>
                {link.title}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col items-start gap-[5px]">
            {linkGroups.legalGroup.map((link) => (
              <NavLink href={link.link} key={link.title}>
                {link.title}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
