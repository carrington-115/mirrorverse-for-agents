import Link from "next/link";

import { navLinks } from "@/lib/data";
import { twMerge } from "tailwind-merge";
import { mobileLinksTypes } from "@/lib/types";

export default function MobileLinks({ isOpen, triggerCloseAction }: mobileLinksTypes) {
  return (
    <>
      <div
        className={twMerge(
          "bottom-0 left-0 right-0 lg:hidden top-[8%] mt-(--spacing-20) hidden size-full flex-col gap-[40%]",
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
                  className="text-4xl text-(--colors-primary) dark:text-(--colors-black-5)"
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
