"use client";

import NavLink from "@/components/nav-link";
import Image from "next/image";
import lightFooterLogo from "@/assets/images/light-logo.svg";
import darkFooterLogo from "@/assets/images/Dark mode.svg";
import { linkGroups } from "@/lib/data";
import { emailSchema } from "@/lib/schema";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";

export default function Footer() {
  const [_pending, startTransition] = useTransition();
  const _updatesForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const _onSubmit = (data: z.infer<typeof emailSchema>) => {
    startTransition(() => console.log("Hello world", data));
  };

  return (
    <footer className="md:py-[87px] lg:px-[161px] flex w-full justify-center border-t border-(--border,#e5e5e5) bg-(--unofficial-accent-0,#fafafa) px-(--spacing-16) py-(--spacing-64)">
      <div className="md:flex-row md:gap-0 flex w-full max-w-[1440px] flex-col items-start justify-between gap-(--spacing-32)">
        <div className="lg:w-[251px] flex flex-col items-start gap-(--spacing-16)">
          <div className="relative h-[26px] w-[132px]">
            <Image
              src={lightFooterLogo}
              alt="Mirrro Logo"
              fill
              className="object-contain dark:hidden"
            />
            <Image
              src={darkFooterLogo}
              alt="Mirrro Logo"
              fill
              className="hidden object-contain dark:block"
            />
          </div>
          <p className="font-normal text-sm leading-[20px] text-(--unofficial-foreground-alt,#404040)">
            &copy; Mirrro AI - 2026 - All rights reserved
          </p>
        </div>

        <div className="md:gap-[34px] flex flex-row items-start gap-(--spacing-32)">
          <div className="flex flex-col items-start gap-[5px]">
            {linkGroups.productGroup.map((productLink) => (
              <NavLink href={productLink.link} key={productLink.title}>
                {productLink.title}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col items-start gap-[5px]">
            {linkGroups.legalGroup.map((legalLink) => (
              <NavLink href={legalLink.link} key={legalLink.title}>
                {legalLink.title}
              </NavLink>
            ))}
          </div>
        </div>

        {/* <div className="flex flex-col gap-[6px] items-start w-full md:w-auto mt-[var(--spacing-16)] md:mt-0">
          <form onSubmit={updatesForm.handleSubmit(onSubmit)}>
            <Controller
              name="email"
              control={updatesForm.control}
              render={({ field }) => (
                <Field>
                  <p className="font-normal text-sm leading-[20px] text-[var(--colors-black-90,#0d0d0d)]">
                    Subscribe for updates
                  </p>
                  <div className="flex flex-row items-center gap-[8px] w-full md:w-[384px]">
                    <Input
                      type="email"
                      placeholder="Email"
                      {...field}
                      className="flex-1 bg-white border border-[#cbd5e1] rounded-[6px] py-[8px] px-[12px] font-normal text-sm leading-[20px] text-[var(--general-secondary-foreground,#171717)] placeholder:text-[color:var(--colors-black-10,#d9d9d9)] outline-none focus:border-[var(--unofficial-foreground-alt,#404040)] transition-colors"
                    />
                    <Button
                      variant="default"
                      type="submit"
                      className="px-[16px] py-[8px]"
                    >
                      {pending ? (
                        <>
                          <Loader2 className="animate-spin" /> Signing up...
                        </>
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </div>
                  <FieldDescription className="font-normal text-sm leading-[20px] text-[color:var(--colors-black-30,#8c8c8c)]">
                    Enter your email address
                  </FieldDescription>
                </Field>
              )}
            />
          </form>
        </div> */}
      </div>
    </footer>
  );
}
