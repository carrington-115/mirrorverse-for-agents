import { notFound } from "next/navigation";
import { MOCK_PHONE_NUMBERS } from "@/lib/data";
import { PhoneDetailHeader } from "./phone-detail-header";

interface PhoneDetailShellProps {
  id: string;
  children: React.ReactNode;
}

export function PhoneDetailShell({ id, children }: PhoneDetailShellProps) {
  const phone = MOCK_PHONE_NUMBERS.find((n) => n.id === id);
  if (!phone) notFound();

  return (
    <div className="gap-4 flex w-full flex-col">
      <PhoneDetailHeader phone={phone} />
      {children}
    </div>
  );
}
