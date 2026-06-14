"use client";

import { usePathname, useRouter } from "next/navigation";

export function useNewChatNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return function startNewChat() {
    // If Next.js thinks the current route is /mirrorpilot, the browser URL may
    // have been silently updated via history.replaceState after the first
    // message was sent. Use a full navigation to guarantee a fresh component
    // tree regardless of that divergence.
    if (pathname === "/mirrorpilot") {
      window.location.href = "/mirrorpilot";
    } else {
      router.push("/mirrorpilot");
    }
  };
}
