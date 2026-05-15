import { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/features/dashboard/components/app-layout";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { createServerTrpcClient } from "@/lib/trpc/server";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: PropsWithChildren) {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Hydrate profile + ensure default workspace. Backend creates both on first
  // call so OAuth users (who skip the setup form) still pass through here.
  const trpc = await createServerTrpcClient();
  const me = await trpc.auth.me.query();
  if (!me.onboardingCompleted) {
    redirect("/onboarding/setup");
  }

  return <AppLayout>{children}</AppLayout>;
}
