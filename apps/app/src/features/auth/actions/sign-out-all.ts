"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOutAllAction(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/sign-in");
}
