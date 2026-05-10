import type { ReactNode } from "react";
import { PhoneDetailShell } from "@/features/deploy/components/phone/phone-detail-shell";

export default async function PhoneDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PhoneDetailShell id={id}>{children}</PhoneDetailShell>;
}
