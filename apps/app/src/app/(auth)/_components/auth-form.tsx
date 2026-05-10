"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "@/lib/schema";
import { z } from "zod";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import OAuthButtons from "./oauth-buttons";

export type AuthMode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: AuthMode;
}

interface ModeCopy {
  heading: string;
  subheading: string;
  submitLabel: string;
  next: string;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
}

function copyFor(mode: AuthMode): ModeCopy {
  if (mode === "sign-up") {
    return {
      heading: "Create an account",
      subheading: "Enter your email and we'll send you a 6-digit code",
      submitLabel: "Continue",
      next: "/account-setup/user-role",
      footerText: "Already have an account?",
      footerLinkHref: "/sign-in",
      footerLinkLabel: "Sign in",
    };
  }
  return {
    heading: "Welcome back",
    subheading: "Enter your email and we'll send you a 6-digit code",
    submitLabel: "Sign in with email",
    next: "/dashboard",
    footerText: "Don't have an account?",
    footerLinkHref: "/sign-up",
    footerLinkLabel: "Sign up",
  };
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const copy = copyFor(mode);

  type FormZodValues = z.infer<typeof signInSchema>;

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors: _formErrors },
  } = useForm<FormZodValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: FormZodValues) => {
    const supabase = createClient();
    const { email } = data;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(copy.next)}`,
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Check your email for a 6-digit code");
    const params = new URLSearchParams({ email, next: copy.next });
    router.push(`/account-setup/verify-account?${params.toString()}`);
  };

  return (
    <div className="flex w-full flex-col items-center gap-(--xl)">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex w-[350px] flex-col gap-[24px]"
      >
        <div className="flex flex-col items-center">
          <h2 className="font-semibold text-[24px] leading-(--heading-3-line-height) text-foreground">
            {copy.heading}
          </h2>
          <p className="text-sm font-normal leading-(--body-1-line-height) text-muted-foreground">
            {copy.subheading}
          </p>
        </div>

        <div className="flex flex-col gap-(--sm)">
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="email@example.com"
                  autoComplete="email"
                  type="email"
                  className="h-10 w-full border-(--border-3)"
                  disabled={isSubmitting}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button type="submit" className="h-10 w-full cursor-pointer" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {copy.submitLabel}
          </Button>
        </div>
      </form>

      <div className="flex w-full flex-col items-center gap-(--sm)">
        <div className="flex w-full items-center justify-center gap-(--sm)">
          <span className="h-px w-1/4 bg-border" />
          <p className="text-sm font-normal leading-(--body-1-line-height) text-muted-foreground">
            Or continue with
          </p>
          <span className="h-px w-1/4 bg-border" />
        </div>

        <OAuthButtons redirectPath={copy.next} disabled={isSubmitting} />
      </div>

      <div className="flex w-full items-center justify-center">
        <p className="text-sm font-normal max-w-[350px] text-center leading-(--body-1-line-height) text-muted-foreground">
          By clicking continue, you agree to our&nbsp;
          <Link
            href="https://www.notion.so/Mirrroverse-Privacy-Policy-05cef81cb4c944a5ab6cb13d034dd873"
            className="text-primary underline"
            target="_blank"
          >
            Terms of Service
          </Link>
          &nbsp;and&nbsp;
          <Link
            href="https://www.notion.so/Mirrroverse-Privacy-Policy-05cef81cb4c944a5ab6cb13d034dd873"
            className="text-primary underline"
            target="_blank"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <div className="flex w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {copy.footerText}{" "}
          <Link href={copy.footerLinkHref} className="font-medium text-primary hover:underline">
            {copy.footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
