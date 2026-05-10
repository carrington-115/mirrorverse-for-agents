import { buildMetadata } from "@/lib/seo/metadata";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to Mirroverse to continue building with agents.",
  path: "/sign-in",
});

export function SignInPage() {
  return (
    <div>
      <AuthForm mode="sign-in" />
    </div>
  );
}
