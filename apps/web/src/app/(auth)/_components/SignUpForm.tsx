"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/lib/schema";
import { z } from "zod";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { useSignUp, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function SignUpForm() {
  const { signUp } = useSignUp();
  const { loaded: isLoaded, user } = useClerk();
  const router = useRouter();

  type FormZodValues = z.infer<typeof signUpSchema>;

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors: formErrors },
  } = useForm<FormZodValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(signUpSchema),
  });

  const handleSignUp = async (data: FormZodValues) => {
    if (!isLoaded || !signUp) {
      toast.error("Please wait, loading...");
      return;
    }

    const { email, password } = data;

    try {
      if (signUp.status !== "complete") {
        console.log("Resetting sign-up...");
        signUp.reset?.();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const { error } = await signUp.password({
        emailAddress: email,
        password: password,
      });

      if (error) {
        toast.error(error.message || "Failed to create account");
        return;
      }

      await signUp.verifications.sendEmailCode();

      toast.success("Verification code sent to your email!");
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.message || "Sign-up failed");
      signUp.reset?.();
    }
  };

  const handleGoogleAuth = async () => {
    if (!isLoaded || !signUp) {
      toast.error("Please wait, loading...");
      return;
    }

    try {
      signUp.reset?.();

      await signUp.sso({
        strategy: "oauth_google",
        redirectUrl: "/account-setup/user-role",
        redirectCallbackUrl: "/account-setup/user-role",
      });
    } catch (error: any) {
      console.error("Google OAuth error:", error);
      toast.error(
        error?.errors?.[0]?.message || "Failed to sign up with Google",
      );
    }
  };

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-[var(--xl)]">
      <form
        onSubmit={handleSubmit(handleSignUp)}
        className="flex flex-col gap-[24px] w-[350px]"
      >
        <div className="flex flex-col items-center">
          <h2 className="text-[24px] text-foreground font-semibold leading-[var(--heading-3-line-height)]">
            Create an account
          </h2>
          <p className="text-sm text-muted-foreground font-normal leading-[var(--body-1-line-height)]">
            Enter your email and password to create an account
          </p>
        </div>

        <div className="flex flex-col gap-[var(--sm)]">
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
                  className="w-full h-10 border-[var(--border-3)]"
                  disabled={isSubmitting}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Password (min 8 characters)"
                  autoComplete="new-password"
                  type="password"
                  className="w-full h-10 border-[var(--border-3)]"
                  disabled={isSubmitting}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  type="password"
                  className="w-full h-10 border-[var(--border-3)]"
                  disabled={isSubmitting}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button
            type="submit"
            className="w-full h-10 cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </div>
      </form>

      <div className="w-full flex flex-col items-center gap-[var(--sm)]">
        <div className="w-full flex justify-center items-center gap-[var(--sm)]">
          <span className="w-1/4 h-[1px] bg-border" />
          <p className="text-sm text-muted-foreground font-normal leading-[var(--body-1-line-height)]">
            Or continue with
          </p>
          <span className="w-1/4 h-[1px] bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-10 cursor-pointer"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
        >
          <FaGoogle className="mr-2" />
          Continue with Google
        </Button>
      </div>

      <div id="clerk-captcha" />

      <div className="w-full flex justify-center items-center">
        <p className="text-center max-w-[350px] text-sm text-muted-foreground font-normal leading-[var(--body-1-line-height)]">
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

      <div className="w-full flex justify-center items-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
