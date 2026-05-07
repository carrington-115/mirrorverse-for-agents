import { twMerge } from "tailwind-merge";
import { iconButtonProps } from "@/lib/types";

export default function IconButton({ icon, color, bgColor }: iconButtonProps) {
  return (
    <>
      <button
        className={twMerge(
          "flex cursor-pointer items-center justify-center rounded-full p-(--spacing-10)",
          color,
          bgColor,
        )}
      >
        {icon}
      </button>
    </>
  );
}
