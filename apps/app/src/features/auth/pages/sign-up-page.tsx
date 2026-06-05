import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo/metadata";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata = buildMetadata({
  title: "Create your account",
  description: "Create a Mirrorverse account to start building with agents.",
  path: "/sign-up",
});

export function SignUpPage() {
  return (
    <div>
      <Suspense>
        <AuthForm mode="sign-up" />
      </Suspense>
    </div>
  );
}
