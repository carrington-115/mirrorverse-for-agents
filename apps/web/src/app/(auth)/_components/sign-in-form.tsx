"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "@/lib/schema";
import { z } from "zod";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function SignInForm() {
  const { signIn } = useSignIn();
  const { loaded: isLoaded, user } = useClerk();
  const router = useRouter();

  type FormZodValues = z.infer<typeof signInSchema>;

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors: _formErrors },
  } = useForm<FormZodValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: FormZodValues) => {
    if (!isLoaded || !signIn) {
      toast.error("Please wait, loading...");
      return;
    }

    const { email, password } = data;

    try {
      const { error } = await signIn.password({
        emailAddress: email,
        password: password,
      });

      if (error) {
        toast.error(error.message || "Failed to sign in");
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/dashboard");

            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else {
        toast.error("Sign-in incomplete");
      }
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.message || "Sign-in failed");
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) {
      toast.error("Please wait, loading...");
      return;
    }

    try {
      console.log("Starting Google sign-in...");

      await signIn.sso({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectCallbackUrl: "/dashboard",
      });
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast.error(error?.errors?.[0]?.message || "Failed to sign in with Google");
    }
  };

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <div className="gap-4 flex min-h-[400px] w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-(--xl)">
      <form onSubmit={handleSubmit(onSubmit)} className="flex w-[350px] flex-col gap-[24px]">
        <div className="flex flex-col items-center">
          <h2 className="font-semibold text-[24px] leading-(--heading-3-line-height) text-foreground">
            Welcome back
          </h2>
          <p className="text-sm font-normal leading-(--body-1-line-height) text-muted-foreground">
            Enter your details to sign in to your account
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

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Password"
                  autoComplete="current-password"
                  type="password"
                  className="h-10 w-full border-(--border-3)"
                  disabled={isSubmitting}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Link href="/forgot-password" className="text-sm text-right text-primary hover:underline">
            Forgot password?
          </Link>

          <Button type="submit" className="h-10 w-full cursor-pointer" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
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

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full cursor-pointer"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <FaGoogle className="mr-2" />
          Continue with Google
        </Button>
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
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
