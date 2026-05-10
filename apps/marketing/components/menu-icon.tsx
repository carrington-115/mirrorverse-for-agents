import { Menu, X } from "lucide-react";
import { menuIconProps } from "@/lib/types";

export default function MenuIcon({ isOpen, action }: menuIconProps) {
  return (
    <button
      onClick={action}
      className="lg:hidden flex size-[40px] cursor-pointer items-center justify-center"
    >
      {isOpen ? (
        <X size={24} className="text-black dark:text-white" />
      ) : (
        <Menu size={24} className="text-black dark:text-white" />
      )}
    </button>
  );
}
