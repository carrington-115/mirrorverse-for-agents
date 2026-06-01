"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import logoImg from "@/assets/images/mirrorpilot-icon.svg";
import NavLink from "./nav-link";
import { NavDropdown } from "./nav-dropdown";
import { ProductDropdown } from "./product-dropdown";
import { UseCasesDropdown } from "./use-cases-dropdown";
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
        "inset-x-0 top-0 lg:px-[120px] lg:py-[10px] fixed z-50 flex flex-col items-center px-(--spacing-20) py-(--spacing-10)",
        menuIsOpen && "bottom-0",
        (scrolled || menuIsOpen) && "bg-white shadow-sm",
      )}
    >
      <div className="flex h-auto w-full items-center justify-between">
        <Link href="/">
          <div className="lg:ml-[5px] lg:w-[120px] flex h-auto w-[92px] shrink-0 items-center">
            <Image alt="Mirrorverse" className="size-8 dark:hidden" src={logoImg} />
            <h1 className="text-2xl font-bold text-[#2c2c2c]">Mirrorverse</h1>
          </div>
        </Link>

        <nav className="lg:flex mr-[4px] hidden shrink-0">
          <ul className="flex shrink-0 items-center gap-[0] px-[20px]">
            {navLinks.map((link) => (
              <li key={link.label} className="list-none">
                {link.product ? (
                  <ProductDropdown
                    label={link.label}
                    left={link.product.left}
                    right={link.product.right}
                    banner={link.product.banner}
                  />
                ) : link.useCases ? (
                  <UseCasesDropdown
                    label={link.label}
                    left={link.useCases.left}
                    right={link.useCases.right}
                    banner={link.useCases.banner}
                  />
                ) : link.children ? (
                  <NavDropdown label={link.label} items={link.children} featured={link.featured} />
                ) : link.href ? (
                  <NavLink href={link.href}>{link.label}</NavLink>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:flex hidden items-center gap-[8px]">
          <Link
            href="https://cal.com/frumark/mirrroagents"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "font-medium rounded-full text-[14px] leading-[20px]",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a demo
          </Link>
          <Link
            href="#"
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
