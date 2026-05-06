"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import logoImg from "@/assets/images/light-logo.svg";
import NavLink from "./NavLink";
import MenuIcon from "./MenuIcon";
import { navLinks } from "@/lib/data";
import MobileLinks from "./MobileLinks";
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
        className={`fixed inset-x-0 top-0 ${
          menuIsOpen && "bottom-0"
        } z-50 overflow-clip py-[var(--spacing-10)] px-[var(--spacing-20)] flex flex-col items-center ${
          (scrolled ? "bg-white" : "") || (menuIsOpen ? "bg-white" : "")
        } ${
          scrolled ? "border-b border-[var(--colors-black-10)]" : ""
        } lg:px-[120px] lg:py-[10px]`}
      >
        <div className="w-full h-auto flex items-center justify-between">
          <Link href="#">
            <div className="w-[92px] h-auto lg:ml-[5px] lg:w-[120px] md:w-[131px] flex-shrink-0">
              <Image
                alt="mirrro"
                className="dark:hidden w-full h-full object-cover"
                src={logoImg}
              />
            </div>
          </Link>

          <nav className="lg:flex hidden flex-shrink-0 mr-[4px]">
            <ul className="flex gap-[14px] items-center px-[20px] flex-shrink-0">
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
              "text-[14px] font-medium leading-[20px]",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a call
          </Link>

          {/* mobile menu */}
          <MenuIcon
            isOpen={menuIsOpen}
            action={() => setMenuIsOpen(!menuIsOpen)}
          />
        </div>
        <MobileLinks
          isOpen={menuIsOpen}
          triggerCloseAction={() => setMenuIsOpen(false)}
        />
      </header>
    </>
  );
}
