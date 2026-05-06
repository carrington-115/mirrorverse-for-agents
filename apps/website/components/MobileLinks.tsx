import Link from "next/link";

import { navLinks } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";
import { mobileLinksTypes } from "@/lib/types";

export default function MobileLinks({
  isOpen,
  triggerCloseAction,
}: mobileLinksTypes) {
  return (
    <>
      <div
        className={twMerge(
          "bottom-0 left-0 right-0 top-[8%] mt-[var(--spacing-20)] w-full h-[100%] gap-[40%] hidden flex-col lg:hidden",
          isOpen && "flex",
        )}
        style={{
          transition: "height 1s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <nav className="flex">
          <ul className="flex flex-col gap-[5px]">
            {navLinks.map((link) => (
              <li className="list-none" key={link.id}>
                <Link
                  href={`#${link.id}`}
                  className="text-4xl text-[var(--colors-primary)] dark:text-[var(--colors-black-5)]"
                  onClick={triggerCloseAction}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
