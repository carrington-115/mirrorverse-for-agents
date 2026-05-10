import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { VerifyOtpForm } from "@/features/onboarding/components/verify-otp-form";

export const metadata = buildMetadata({
  title: "Verify your email",
  description: "Enter the one-time code we sent to verify your account.",
  noIndex: true,
});

export function VerifyAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
