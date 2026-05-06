import { notFound } from "next/navigation";
import { MOCK_PHONE_NUMBERS } from "@/lib/data";
import PhoneDetailHeader from "./_components/PhoneDetailHeader";
import PhoneTabNav from "./_components/PhoneTabNav";

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
    <div className="flex flex-col gap-4 w-full">
      <PhoneDetailHeader phone={phone} />
      <PhoneTabNav id={id} />
      {children}
    </div>
  );
}
