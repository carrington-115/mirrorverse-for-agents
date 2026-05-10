import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Page not found",
  description: "We couldn't find the page you were looking for.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <main className="gap-4 px-6 flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-4">
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
