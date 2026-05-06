import { MOCK_TRANSCRIPTS } from "@/lib/data";
import TranscriptsPage from "../_components/TranscriptsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transcripts = MOCK_TRANSCRIPTS.filter((t) => t.phoneNumberId === id);
  return <TranscriptsPage transcripts={transcripts} />;
}
