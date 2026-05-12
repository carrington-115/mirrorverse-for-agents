import Image from "next/image";

import mirropilotIcon from "@/assets/mirropilot-icon.svg";

export function AssistantAvatar() {
  return (
    <div className="size-7 grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-background">
      <Image src={mirropilotIcon} alt="Mirropilot" width={16} height={16} />
    </div>
  );
}
