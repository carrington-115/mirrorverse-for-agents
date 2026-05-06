import { Menu, X } from "lucide-react";
import { menuIconProps } from "@/lib/types";

export default function MenuIcon({ isOpen, action }: menuIconProps) {
  return (
    <button
      onClick={action}
      className="flex items-center justify-center w-[40px] h-[40px] lg:hidden cursor-pointer"
    >
      {isOpen ? (
        <X size={24} className="text-black dark:text-white" />
      ) : (
        <Menu size={24} className="text-black dark:text-white" />
      )}
    </button>
  );
}
