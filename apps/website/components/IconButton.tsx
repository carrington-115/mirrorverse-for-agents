import { twMerge } from "tailwind-merge";
import { iconButtonProps } from "@/lib/types";

export default function IconButton({ icon, color, bgColor }: iconButtonProps) {
  return (
    <>
      <button
        className={twMerge(
          "p-[var(--spacing-10)] rounded-full flex items-center justify-center cursor-pointer",
          color,
          bgColor
        )}
      >
        {icon}
      </button>
    </>
  );
}
