import { MirrropilotChat } from "../_components/MirrropilotChat";

// The page stays a Server Component — it resolves params and
// passes the sessionId down to the client component.
// All streaming, state, and interactivity live in MirrropilotChat.

export default async function MirrropilotPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <div className="flex h-full w-full flex-col">
      <MirrropilotChat sessionId={sessionId} />
    </div>
  );
}
