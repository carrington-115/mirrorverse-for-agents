"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import logoImg from "@/assets/images/mirrorpilot-icon.svg";
import NavLink from "./nav-link";
import MenuIcon from "./menu-icon";
import { navLinks } from "@/lib/data";
import MobileLinks from "./mobile-links";
import { buttonVariants } from "@/components/ui/button";

export default function NavBar() {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 100);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "inset-x-0 top-0 lg:px-[120px] lg:py-[10px] fixed z-50 flex w-screen flex-col items-center px-[14px] py-(--spacing-10)",
        menuIsOpen && "bottom-0",
        (scrolled || menuIsOpen) && "bg-white",
      )}
    >
      <div className="md:px-(--spacing-10) md:py-(--spacing-5) flex h-auto w-full items-center justify-between px-[16px] py-[10px]">
        <Link href="/">
          <div className="lg:ml-[5px] lg:w-[120px] flex h-auto w-[92px] shrink-0 items-center">
            <Image alt="Mirrorverse" className="size-8 md:size-8 dark:hidden" src={logoImg} />
            <h1 className="text-2xl font-bold text-[#2c2c2c]">Mirrorverse</h1>
          </div>
        </Link>

        <nav className="lg:flex mr-[4px] hidden shrink-0">
          <ul className="flex shrink-0 items-center gap-[0] px-[20px]">
            {navLinks.map((link) => (
              <li key={link.label} className="list-none">
                <NavLink href={link.href}>{link.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:flex hidden items-center gap-[8px]">
          <Link
            href="https://cal.com/frumark/mirrroagents"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "font-medium text-black rounded-full text-[14px] leading-[20px]",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a demo
          </Link>
          <Link
            href="https://work.mirrro.io"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "font-medium rounded-full text-[14px] leading-[20px]",
            )}
          >
            Try for free
          </Link>
        </div>

        <MenuIcon isOpen={menuIsOpen} action={() => setMenuIsOpen(!menuIsOpen)} />
      </div>

      <MobileLinks isOpen={menuIsOpen} triggerCloseAction={() => setMenuIsOpen(false)} />
    </header>
  );
}
