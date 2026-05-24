"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChannelSearchBarProps {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  actions?: React.ReactNode;
}

export function ChannelSearchBar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  actions: _actions,
}: ChannelSearchBarProps) {
  return (
    <div className="gap-2 md:gap-0 flex w-full items-center justify-between">
      <div className="md:max-w-[596px] md:flex-1 relative flex-[7]">
        <Search className="left-3 size-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>
      <Select value={dateFilter} onValueChange={onDateFilterChange}>
        <SelectTrigger className="md:w-[200px] md:flex-none flex-[3]">
          <SelectValue placeholder="Filter by date added" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All dates</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This week</SelectItem>
          <SelectItem value="month">This month</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
