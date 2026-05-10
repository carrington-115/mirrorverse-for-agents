// Dashboard reads the Supabase session via useSupabaseUser, which calls
// createBrowserClient at module init. That can't run during static prerender
// without real env vars, so opt every dashboard route out of static rendering.
export const dynamic = "force-dynamic";

export { AppLayout as default } from "@/features/dashboard/components/app-layout";
