import Image from "next/image";

import mirrorpilotIconLight from "@/assets/mirrorpilot-icon.svg";
import mirrorpilotIconDark from "@/assets/mirrorpilot-icon-dark.svg";

export function AssistantAvatar() {
  return (
    <div className="size-7 grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-background">
      <Image
        src={mirrorpilotIconLight}
        alt="Mirrro"
        width={16}
        height={16}
        className="dark:hidden"
      />
      <Image
        src={mirrorpilotIconDark}
        alt="Mirrro"
        width={16}
        height={16}
        className="hidden dark:block"
      />
    </div>
  );
}
