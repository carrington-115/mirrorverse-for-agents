"use client";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CODE_LENGTH = 6;

function VerifyAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email");
  const nextParam = searchParams.get("next");
  const email = emailParam === null ? "" : emailParam;
  const next = nextParam === null ? "/mirrropilot" : nextParam;

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (code.length !== CODE_LENGTH) {
      toast.error(`Enter all ${CODE_LENGTH} digits`);
      return;
    }

    const supabase = createClient();
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      router.push(next);
    } finally {
      setIsVerifying(false);
    }
  };

  if (email.length === 0) {
    return (
      <div className="gap-4 flex min-h-screen flex-col items-center justify-center">
        <p className="font-medium text-foreground">No email address provided</p>
        <p className="text-sm text-muted-foreground">Please start the sign-in process again</p>
        <Link href="/sign-in">
          <Button variant="outline">Back to Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 flex min-h-screen flex-col items-center justify-center">
      <div className="flex w-full max-w-[430px] flex-col items-center gap-(--lg)">
        <div className="flex flex-col items-center gap-(--xxs)">
          <h1 className="font-semibold text-center text-[24px] leading-(--heading-3-line-height) text-foreground">
            Enter one-time code
          </h1>
          <p className="font-normal mt-2 text-center leading-(--body-1-line-height) text-muted-foreground">
            Enter the code we sent to your email to access organization
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex w-full flex-col items-center gap-(--lg)">
          <InputOTP maxLength={CODE_LENGTH} value={code} onChange={setCode} disabled={isVerifying}>
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
            disabled={code.length !== CODE_LENGTH || isVerifying}
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyAccountContent />
    </Suspense>
  );
}
