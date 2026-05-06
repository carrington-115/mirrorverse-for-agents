"use client";

import { Button } from "@/components/ui/button";
import NavLink from "@/components/NavLink";
import Image from "next/image";
import lightFooterLogo from "@/assets/images/light-logo.svg";
import darkFooterLogo from "@/assets/images/Dark mode.svg";
import { linkGroups } from "@/lib/data";
import { emailSchema } from "@/lib/schema";
import z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldDescription, FieldLegend } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export default function Footer() {
  const [pending, startTransition] = useTransition();
  const updatesForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof emailSchema>) => {
    startTransition(() => console.log("Hello world", data));
  };

  return (
    <footer className="w-full flex justify-center py-[var(--spacing-64)] md:py-[87px] px-[var(--spacing-16)] lg:px-[161px] bg-[var(--unofficial-accent-0,#fafafa)] border-t border-[var(--border,#e5e5e5)]">
      <div className="w-full max-w-[1440px] flex flex-col md:flex-row justify-between items-start gap-[var(--spacing-32)] md:gap-0">
        <div className="flex flex-col gap-[var(--spacing-16)] items-start lg:w-[251px]">
          <div className="w-[132px] h-[26px] relative">
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
              className="object-contain hidden dark:block"
            />
          </div>
          <p className="font-normal text-sm leading-[20px] text-[var(--unofficial-foreground-alt,#404040)]">
            &copy; Mirrro AI - 2026 - All rights reserved
          </p>
        </div>

        <div className="flex flex-row gap-[var(--spacing-32)] md:gap-[34px] items-start">
          <div className="flex flex-col gap-[5px] items-start">
            {linkGroups.productGroup.map((productLink) => (
              <NavLink href={productLink.link} key={productLink.title}>
                {productLink.title}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col gap-[5px] items-start">
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
