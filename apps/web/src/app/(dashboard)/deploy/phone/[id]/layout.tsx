import { notFound } from "next/navigation";
import { MOCK_PHONE_NUMBERS } from "@/lib/data";
import PhoneDetailHeader from "./_components/phone-detail-header";
import PhoneTabNav from "./_components/phone-tab-nav";

export default async function PhoneDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const phone = MOCK_PHONE_NUMBERS.find((n) => n.id === id);
  if (!phone) notFound();

  return (
    <div className="gap-4 flex w-full flex-col">
      <PhoneDetailHeader phone={phone} />
      <PhoneTabNav id={id} />
      {children}
    </div>
  );
}
