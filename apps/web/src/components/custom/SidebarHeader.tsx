"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { teamsData, type Team } from "@/lib/data";
import Image from "next/image";
import mirrroLogo from "@/assets/mirrropilot-icon.svg";
import { Button } from "@/components/ui/button";

export default function SidebarHeaderComponent() {
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team>(teamsData[0]);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setOpen(false);
  };

  // Collapsed "icon" mode — show only the logo with tooltip
  if (isCollapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className="flex items-center justify-center rounded-md p-1 cursor-pointer transition-colors hover:bg-sidebar-accent"
                aria-label="Switch team"
              >
                <Image
                  src={mirrroLogo}
                  alt="mirrro logo"
                  width={27}
                  height={20}
                  className="shrink-0"
                />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{selectedTeam.orgName}</TooltipContent>
        </Tooltip>

        <PopoverContent
          align="start"
          side="right"
          sideOffset={6}
          className="w-[15rem] p-0"
        >
          <TeamDropdownContent
            teams={teamsData}
            selectedTeam={selectedTeam}
            onSelect={handleTeamSelect}
            onClose={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Expanded mode — full header with logo, org name, team, chevron
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex w-full items-center gap-[var(--xs)] rounded-md bg-transparent p-[var(--2xs)] cursor-pointer transition-colors hover:bg-sidebar-accent active:bg-sidebar-accent"
          aria-label="Switch team"
        >
          <Image
            src={mirrroLogo}
            alt="mirrro logo"
            width={27}
            height={20}
            className="shrink-0"
          />

          <span className="text-lg text-muted-foreground shrink-0">/</span>

          <div className="flex flex-col items-start min-w-0">
            <span className="text-base font-medium text-foreground leading-[16px] truncate">
              {selectedTeam.orgName}
            </span>
            <span className="text-xs text-accent-foreground leading-normal truncate">
              {selectedTeam.name}
            </span>
          </div>

          <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-[15rem] p-0"
      >
        <TeamDropdownContent
          teams={teamsData}
          selectedTeam={selectedTeam}
          onSelect={handleTeamSelect}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

// Shared dropdown content for both collapsed and expanded modes
function TeamDropdownContent({
  teams,
  selectedTeam,
  onSelect,
  onClose,
}: {
  teams: Team[];
  selectedTeam: Team;
  onSelect: (team: Team) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="px-[var(--xs)] py-[5.5px]">
        <p className="text-xs font-medium text-muted-foreground leading-[16px]">
          Teams
        </p>
      </div>

      <div className="flex flex-col">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => onSelect(team)}
            className="flex items-center gap-3 px-3 py-[7.5px] min-h-[36px] rounded-md cursor-pointer hover:bg-accent transition-colors"
          >
            <Avatar size="sm" className="size-5">
              <AvatarFallback className="text-[10px] font-semibold">
                {team.initials}
              </AvatarFallback>
            </Avatar>

            <span className="flex-1 text-sm text-foreground text-left truncate">
              {team.name}
            </span>

            {selectedTeam.id === team.id && (
              <Check className="size-4 shrink-0 text-foreground" />
            )}
          </button>
        ))}
      </div>

      <Separator />

      <Button
        onClick={onClose}
        variant="ghost"
        className="cursor-pointer mx-[8px] mb-[8px]"
      >
        <div className="flex items-center justify-center size-5 shrink-0">
          <Plus className="size-4" />
        </div>
        <span className="text-sm text-foreground">Add new team</span>
      </Button>
    </>
  );
}
