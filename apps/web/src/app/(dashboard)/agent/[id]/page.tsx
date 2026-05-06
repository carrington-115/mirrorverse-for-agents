import { redirect } from "next/navigation";

export default async function AgentDetailIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agent/${id}/configuration`);
}
