"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Field, FieldError } from "@/components/ui/field";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/schema";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const { signIn } = useSignIn();
  const { loaded: isLoaded } = useClerk();
  const router = useRouter();

  type FormValues = z.infer<typeof resetPasswordSchema>;
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors: formErrors },
  } = useForm<FormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: FormValues) => {
    if (!isLoaded || !signIn) {
      toast.error("Please wait, loading...");
      return;
    }

    const { password } = data;

    try {
      console.log("Attempting password reset...");

      // Attempt to reset the password
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password: password,
      });

      if (error) {
        console.error("Password reset error:", error);
        toast.error(error.message || "Failed to reset password");
        return;
      }

      console.log("Password reset status:", signIn.status);

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
        console.error("Password reset not complete:", signIn.status);
        toast.error("Password reset incomplete. Please try again.", {
          description: "Please try again.",
          action: {
            label: "Try again",
            onClick: () => router.refresh(),
          },
        });
      }
    } catch (error: any) {
      console.error("Unexpected password reset error:", error);

      const errorMessage =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        error?.message ||
        "Failed to reset password";

      toast.error(errorMessage);
    }
  };
  return (
    <div>
      <Card className="w-[450px]">
        <form>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your
              password.
            </CardDescription>
          </CardHeader>
          <CardContent className="my-[var(--md)] flex flex-col gap-[var(--xs)]">
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    placeholder="Enter your password"
                    className="w-full h-10 border-[var(--border-3)]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    placeholder="Confirm your password"
                    className="w-full h-10 border-[var(--border-3)]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-[var(--2xs)]">
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </Button>
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "sm",
                }),
                "w-full",
              )}
            >
              Back to Sign In
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
