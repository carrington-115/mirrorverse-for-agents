"use client";

import { Button } from "@/components/ui/button";
import { appSelectProps, IconComponent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
import { IconBaseProps } from "react-icons";
import Image from "next/image";
import mirrropilotIcon from "@/assets/mirrropilot-icon.svg";

interface ToolIconProps extends IconBaseProps {
  icon: IconComponent;
}

export function ToolIcon({ icon: Icon, className = "", ...props }: ToolIconProps) {
  return <Icon className={`h-10 w-10 text-primary ${className}`} {...props} />;
}

export default function AppSelectComponent({
  name,
  description,
  url,
  icon,
  selected,
  onSelect,
}: appSelectProps) {
  return (
    <>
      <Button
        variant={"outline"}
        onClick={() => onSelect({ name, description, url, icon })}
        className={cn(
          "cursor-pointer rounded-full",
          selected ? "border-foreground" : "border-border",
        )}
      >
        <>
          {icon && <ToolIcon icon={icon} size={16} />}
          {name}
        </>
        {selected && <BadgeCheck size={16} className="text-foreground" />}
      </Button>
    </>
  );
}

export function MirroPilotOptionComponent() {
  const mirrropilotOption = {
    name: "Mirrropilot",
    description: "Mirrropilot is a AI Agent for your business",
    url: "https://mirrropilot.com",
  };
  return (
    <>
      <Button
        variant={"outline"}
        aria-disabled
        className={cn("cursor-pointer rounded-full", "border-foreground")}
      >
        <>
          <Image src={mirrropilotIcon} alt="Mirrro Pilot" width={16} height={16} />
          {mirrropilotOption.name}
        </>
        <BadgeCheck size={16} className="text-foreground" />
      </Button>
    </>
  );
}
