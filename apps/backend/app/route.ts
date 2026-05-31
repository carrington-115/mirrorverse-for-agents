export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Root health check (replaces the static public/index.html landing page).
export function GET(): Response {
  return Response.json({ status: "ok", service: "@mirrorverse/backend" });
}
