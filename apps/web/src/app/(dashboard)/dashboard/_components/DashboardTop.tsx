"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Layers,
  Phone,
  Send,
  Shapes,
  Users,
  Wrench,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as React from "react";
import { addDays, format } from "date-fns";
import { type DateRange } from "react-day-picker";
import DashboardTabs from "@/components/custom/DashboardTabs";
import { DashboardCardProps } from "@/lib/types";
import DashboardCard from "@/components/custom/DashboardCard";
import { usePathname } from "next/navigation";

const GRANULARITY_OPTIONS = ["Hour", "Day", "Week", "Month", "Quarter", "Year"];

const DATE_RANGE_OPTIONS = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

export default function DashboardTop() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 12),
    to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
  });
  const [dateRangeLabel, setDateRangeLabel] = React.useState("Last 7 days");
  const [granularity, setGranularity] = React.useState("Day");
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const formattedRange =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : "Date range";

  const handleDateRangePreset = (label: string, days: number) => {
    const to = new Date();
    const from = days === 0 ? new Date() : addDays(new Date(), -days);
    setDateRange({ from, to });
    setDateRangeLabel(label);
  };

  return (
    <div className="flex w-[70%] flex-col gap-[var(--xl)] items-start">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col items-start gap-[var(--3xs)]">
          <div className="flex items-center gap-[var(--sm)]">
            <p className="text-[var(--paragraph-mini-regular)] text-muted-foreground leading-[var(--2xs)]">
              My workspace
            </p>
            <Button className="cursor-pointer rounded-full" size={"xs"}>
              Last seen <ArrowRight />
            </Button>
          </div>
          <h1 className="text-[30px] font-semibold">Good morning, Melvis</h1>
        </div>
        <Button
          className="flex flex-col items-start h-fit cursor-pointer px-2 py-1"
          variant={"ghost"}
        >
          <p className="text-[var(--paragraph-mini-regular)] text-muted-foreground">
            Team members
          </p>
          <AvatarGroup className="grayscale">
            <Avatar size="sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarImage
                src="https://github.com/maxleiter.png"
                alt="@maxleiter"
              />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarImage
                src="https://github.com/evilrabbit.png"
                alt="@evilrabbit"
              />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
        </Button>
      </div>

      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-[var(--sm)]">
          <ButtonGroup>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  size={"sm"}
                  className="cursor-pointer"
                >
                  <Calendar /> {dateRange?.from ? formattedRange : "Date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarRange
                  dateRange={dateRange}
                  onDateRangeChange={(range) => {
                    setDateRange(range);
                    if (range?.from && range?.to) setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <ButtonGroupSeparator />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"outline"}
                  size={"sm"}
                  className="cursor-pointer"
                >
                  {dateRangeLabel} <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.label}
                    onClick={() =>
                      handleDateRangePreset(option.label, option.days)
                    }
                    className={
                      dateRangeLabel === option.label ? "bg-accent" : ""
                    }
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>

          <div className="flex h-[20px]">
            <Separator orientation="vertical" />
          </div>

          <ButtonGroup>
            <Button
              variant={"outline"}
              size={"sm"}
              className="cursor-pointer select-none"
            >
              Granularity
            </Button>
            <ButtonGroupSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"outline"}
                  size={"sm"}
                  className="cursor-pointer"
                >
                  {granularity} <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {GRANULARITY_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setGranularity(option)}
                    className={granularity === option ? "bg-accent" : ""}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
        <div />
      </div>

      <div className="flex flex-col items-start gap-[var(--sm)] w-full">
        <DashboardTabs />
        <DashboardCards />
      </div>
    </div>
  );
}

interface CalendarRangeProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function CalendarRange({
  dateRange,
  onDateRangeChange,
}: CalendarRangeProps) {
  return (
    <Card className="mx-auto w-fit p-0">
      <CardContent className="p-0">
        <CalendarPicker
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={2}
          disabled={(date) =>
            date > new Date() || date < new Date("1900-01-01")
          }
        />
      </CardContent>
    </Card>
  );
}

const dashboardCardsData: DashboardCardProps[] = [
  {
    title: "Agents",
    icon: <Users size={16} />,
    badgeNumber: 12,
    badgeColor: "bg-green-700",
    onClick: () => {},
  },
  {
    title: "Calls",
    icon: <Phone size={16} />,
    badgeNumber: 12,
    badgeColor: "bg-blue-700",
    onClick: () => {},
  },
  {
    title: "Emails",
    icon: <Send size={16} />,
    badgeNumber: 12,
    badgeColor: "bg-orange-700",
    onClick: () => {},
  },
  {
    title: "Tools",
    icon: <Wrench size={16} />,
    badgeNumber: 12,
    badgeColor: "bg-yellow-700",
    onClick: () => {},
  },
  {
    title: "Files",
    icon: <Layers size={16} />,
    badgeNumber: 12,
    badgeColor: "bg-teal-700",
    onClick: () => {},
  },
  {
    title: "Integrations",
    icon: <Shapes size={16} />,
    badgeNumber: 12,
    badgeColor: "bg-rose-700",
    onClick: () => {},
  },
];

function DashboardCards() {
  const pathname = usePathname();

  if (pathname !== "/dashboard") return null;
  return (
    <div className="w-full flex items-center justify-between">
      {dashboardCardsData.map((card) => (
        <DashboardCard
          key={card.title}
          title={card.title}
          icon={card.icon}
          badgeNumber={card.badgeNumber}
          badgeColor={card.badgeColor}
          onClick={card.onClick}
        />
      ))}
    </div>
  );
}
