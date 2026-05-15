import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { SetupForm } from "@/features/onboarding/components/setup-form";

export const metadata = buildMetadata({
  title: "Set up your profile",
  description: "Tell us a bit about yourself to get started.",
  noIndex: true,
});

export function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SetupForm />
    </Suspense>
  );
}
