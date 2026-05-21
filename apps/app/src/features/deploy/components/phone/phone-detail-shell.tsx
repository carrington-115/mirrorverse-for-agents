import { notFound } from "next/navigation";
import { createServerTrpcClient } from "@/lib/trpc/server";
import { mapDbPhoneToFrontend } from "@/features/deploy/api/types";
import { PhoneDetailHeader } from "./phone-detail-header";

interface PhoneDetailShellProps {
  id: string;
  children: React.ReactNode;
}

export async function PhoneDetailShell({ id, children }: PhoneDetailShellProps) {
  const trpc = await createServerTrpcClient();
  const numbers = await trpc.voice.listNumbers.query();
  const phone = numbers.find((n) => n.id === id);
  if (!phone) notFound();

  const mapped = mapDbPhoneToFrontend(phone);

  return (
    <div className="gap-4 flex w-full flex-col">
      <PhoneDetailHeader phone={mapped} />
      {children}
    </div>
  );
}
