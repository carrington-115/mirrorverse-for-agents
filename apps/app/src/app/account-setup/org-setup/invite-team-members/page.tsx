import { Suspense } from "react";
import SendInviteForm from "../../_components/send-invite-form";

export default function InviteTeamMembers() {
  return (
    <div>
      <Suspense fallback={null}>
        <SendInviteForm />
      </Suspense>
    </div>
  );
}
