"use client";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { handleRegisterUser } from "../actions";
import { useSignUp, useClerk, useSignIn } from "@clerk/nextjs";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();
  const { loaded: isLoaded } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // signup verification
  const handleVerification = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!isLoaded || !signUp) {
      toast.error("Please wait, loading...");
      return;
    }

    setIsVerifying(true);

    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });

      if (error) {
        toast.error(error.message || "Invalid code");
        setIsVerifying(false);
        return;
      }

      if (signUp.status === "complete") {
        try {
          await handleRegisterUser(email, signUp.createdUserId!);
        } catch (err) {
          console.error("Failed to register user:", err);
        }
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/mirrropilot");

            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else {
        toast.error("Verification incomplete");
        setIsVerifying(false);
      }
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.message || "Invalid code");
      setIsVerifying(false);
    }
  };

  // password verification
  const _handlePasscodeVerification = async () => {
    if (!isLoaded || !signUp) {
      toast.error("Please wait, loading...");
      return;
    }

    setIsVerifying(true);

    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code,
      });

      if (error) {
        toast.error(error.message || "Invalid code");
        setIsVerifying(false);
        return;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/account-setup/reset-password");

            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else {
        toast.error("Verification incomplete");
        setIsVerifying(false);
      }
    } catch (error: any) {
      toast.error(error?.errors?.[0]?.message || "Invalid code");
      setIsVerifying(false);
    }
  };

  // resend actions
  const handleResendCode = async () => {
    if (!isLoaded || !signUp) {
      toast.error("Please wait, loading...");
      return;
    }

    setIsResending(true);

    try {
      console.log("Resending verification code...");

      const { error } = await signUp.verifications.sendEmailCode();

      if (error) {
        console.error("Resend error:", error);
        toast.error(error.message || "Failed to resend code");
        setIsResending(false);
        return;
      }

      console.log("Verification code resent successfully");
      toast.success("New code sent to your email!");
      setCode(""); // Clear the input
      setIsResending(false);
    } catch (error: any) {
      console.error("Unexpected resend error:", error);
      toast.error(error?.errors?.[0]?.message || "Failed to resend code");
      setIsResending(false);
    }
  };

  // Show loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="gap-4 flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show error if no email provided
  if (!email) {
    return (
      <div className="gap-4 flex min-h-screen flex-col items-center justify-center">
        <p className="font-medium text-foreground">No email address provided</p>
        <p className="text-sm text-muted-foreground">Please start the sign-up process again</p>
        <Link href="/sign-up">
          <Button variant="outline">Back to Sign Up</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 flex min-h-screen flex-col items-center justify-center">
      <div className="flex w-full max-w-[430px] flex-col items-center gap-(--lg)">
        <div className="flex flex-col items-center gap-(--xxs)">
          <h1 className="font-semibold text-center text-[24px] leading-(--heading-3-line-height) text-foreground">
            Verify your account
          </h1>
          <p className="font-normal mt-2 text-center leading-(--body-1-line-height) text-muted-foreground">
            Enter the 6-digit code sent to
            <br />
            <strong className="text-foreground">{email}</strong>
          </p>
        </div>

        <form
          onSubmit={handleVerification}
          className="flex w-full flex-col items-center gap-(--lg)"
        >
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isVerifying || isResending}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full cursor-pointer"
            disabled={code.length !== 6 || isVerifying || isResending}
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </form>

        <div className="gap-3 mt-4 flex flex-col items-center">
          <p className="text-sm text-muted-foreground">Didn&apos;t receive the code?</p>

          <button
            type="button"
            onClick={handleResendCode}
            className="text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isVerifying || isResending}
          >
            {isResending ? (
              <span className="gap-2 flex items-center">
                <Loader2 className="h-3 w-3 animate-spin" />
                Resending...
              </span>
            ) : (
              "Resend code"
            )}
          </button>

          <Link
            href="/sign-up"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to sign up
          </Link>
        </div>

        <div id="clerk-captcha" />
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
