"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { signIn } = useSignIn();
  const { loaded: isLoaded } = useClerk();
  const router = useRouter();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors: _formErrors },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: FormValues) => {
    if (!isLoaded || !signIn) {
      toast.error("Please wait, loading...");
      return;
    }

    const { email } = data;

    try {
      console.log("Requesting password reset for:", email);

      const { error } = await signIn.create({
        identifier: email,
      });

      if (error) {
        console.error("Password reset request error:", error);
        toast.error(error.message || "Failed to send reset code");
        return;
      }

      const { error: sendCodeError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendCodeError) {
        console.error(JSON.stringify(sendCodeError, null, 2));
        toast.error(sendCodeError.message || "Failed to send reset code");
        return;
      }

      console.log("Reset code sent successfully");
      toast.success("Reset code sent to your email!");

      router.push(`/account-setup/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error("Unexpected error:", error);

      const errorMessage =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        error?.message ||
        "Failed to send reset code";

      toast.error(errorMessage);
    }
  };

  if (!isLoaded) {
    return (
      <div className="gap-4 flex h-screen w-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center overflow-y-hidden">
      <div className="flex w-[430px] flex-col items-center gap-(--xl)">
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-[24px]">
          <div className="flex flex-col items-center">
            <h2 className="font-semibold text-[24px] leading-(--heading-3-line-height) text-foreground">
              Forgot password?
            </h2>
            <p className="text-sm font-normal mt-2 text-center leading-(--body-1-line-height) text-muted-foreground">
              Enter your email address and we&apos;ll send you a code to reset your password
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
              Send Reset Code
            </Button>
          </div>
        </form>

        <div className="flex w-full items-center justify-center">
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
