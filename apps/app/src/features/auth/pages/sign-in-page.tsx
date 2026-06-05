import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo/metadata";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to Mirrorverse to continue building with agents.",
  path: "/sign-in",
});

export function SignInPage() {
  return (
    <div>
      <Suspense>
        <AuthForm mode="sign-in" />
      </Suspense>
    </div>
  );
}
