"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
                className="p-1 flex cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
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

        <PopoverContent align="start" side="right" sideOffset={6} className="p-0 w-[15rem]">
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
          className="flex w-full cursor-pointer items-center gap-(--xs) rounded-md bg-transparent p-(--2xs) transition-colors hover:bg-sidebar-accent active:bg-sidebar-accent"
          aria-label="Switch team"
        >
          <Image src={mirrroLogo} alt="mirrro logo" width={27} height={20} className="shrink-0" />

          <span className="text-lg shrink-0 text-muted-foreground">/</span>

          <div className="min-w-0 flex flex-col items-start">
            <span className="text-base font-medium truncate leading-[16px] text-foreground">
              {selectedTeam.orgName}
            </span>
            <span className="text-xs leading-normal truncate text-accent-foreground">
              {selectedTeam.name}
            </span>
          </div>

          <ChevronsUpDown className="size-4 ml-auto shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" side="bottom" sideOffset={6} className="p-0 w-[15rem]">
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
      <div className="px-(--xs) py-[5.5px]">
        <p className="text-xs font-medium leading-[16px] text-muted-foreground">Teams</p>
      </div>

      <div className="flex flex-col">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => onSelect(team)}
            className="gap-3 px-3 flex min-h-[36px] cursor-pointer items-center rounded-md py-[7.5px] transition-colors hover:bg-accent"
          >
            <Avatar size="sm" className="size-5">
              <AvatarFallback className="font-semibold text-[10px]">{team.initials}</AvatarFallback>
            </Avatar>

            <span className="text-sm flex-1 truncate text-left text-foreground">{team.name}</span>

            {selectedTeam.id === team.id && <Check className="size-4 shrink-0 text-foreground" />}
          </button>
        ))}
      </div>

      <Separator />

      <Button onClick={onClose} variant="ghost" className="mx-[8px] mb-[8px] cursor-pointer">
        <div className="size-5 flex shrink-0 items-center justify-center">
          <Plus className="size-4" />
        </div>
        <span className="text-sm text-foreground">Add new team</span>
      </Button>
    </>
  );
}
