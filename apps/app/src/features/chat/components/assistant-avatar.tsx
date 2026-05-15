import Image from "next/image";

import mirropilotIconLight from "@/assets/mirropilot-icon.svg";
import mirropilotIconDark from "@/assets/mirropilot-icon-dark.svg";

export function AssistantAvatar() {
  return (
    <div className="size-7 grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-background">
      <Image
        src={mirropilotIconLight}
        alt="Mirrro"
        width={16}
        height={16}
        className="dark:hidden"
      />
      <Image
        src={mirropilotIconDark}
        alt="Mirrro"
        width={16}
        height={16}
        className="hidden dark:block"
      />
    </div>
  );
}
