"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import logoImg from "@/assets/images/light-logo.svg";
import NavLink from "./nav-link";
import MenuIcon from "./menu-icon";
import { navLinks } from "@/lib/data";
import MobileLinks from "./mobile-links";
import { twMerge } from "tailwind-merge";
import { buttonVariants } from "@/components/ui/button";

export default function NavBar() {
  const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState(false);

  function handleScroll() {
    setScrolled(window.scrollY > 100);
  }

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.addEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <>
      <header
        className={`inset-x-0 top-0 fixed ${
          menuIsOpen && "bottom-0"
        } z-50 flex flex-col items-center overflow-clip px-(--spacing-20) py-(--spacing-10) ${
          (scrolled ? "bg-white" : "") || (menuIsOpen ? "bg-white" : "")
        } ${scrolled ? "border-b border-(--colors-black-10)" : ""} lg:px-[120px] lg:py-[10px]`}
      >
        <div className="flex h-auto w-full items-center justify-between">
          <Link href="#">
            <div className="lg:ml-[5px] lg:w-[120px] md:w-[131px] h-auto w-[92px] shrink-0">
              <Image alt="mirrro" className="size-full object-cover dark:hidden" src={logoImg} />
            </div>
          </Link>

          <nav className="lg:flex mr-[4px] hidden shrink-0">
            <ul className="flex shrink-0 items-center gap-[14px] px-[20px]">
              {navLinks.map((link) => (
                <li key={link.id} className="list-none">
                  <NavLink href={`#${link.id}`}>{link.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href="https://cal.com/frumark/mirrroagents"
            className={twMerge(
              buttonVariants({
                variant: "default",
                size: "default",
                className: "w-fit",
              }),
              "font-medium text-[14px] leading-[20px]",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a call
          </Link>

          {/* mobile menu */}
          <MenuIcon isOpen={menuIsOpen} action={() => setMenuIsOpen(!menuIsOpen)} />
        </div>
        <MobileLinks isOpen={menuIsOpen} triggerCloseAction={() => setMenuIsOpen(false)} />
      </header>
    </>
  );
}
