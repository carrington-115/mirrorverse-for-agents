import type { ReactNode } from "react";
import { AuthDetail } from "./auth-detail";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <AuthDetail />
      <div className="flex w-1/2 flex-col items-center justify-center">{children}</div>
    </div>
  );
}
