import { buildMetadata } from "@/lib/seo/metadata";
import { PhoneShell } from "@/features/deploy/components/phone/phone-shell";

export const metadata = buildMetadata({
  title: "Phone numbers",
  description: "Manage phone numbers and call routing for your agents.",
  noIndex: true,
});

export function PhonePage() {
  return <PhoneShell />;
}
