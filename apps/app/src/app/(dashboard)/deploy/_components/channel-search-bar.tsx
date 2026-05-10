"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface ChannelSearchBarProps {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  actions?: React.ReactNode;
}

export default function ChannelSearchBar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  actions: _actions,
}: ChannelSearchBarProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="relative max-w-[596px] flex-1">
        <Search className="left-3 size-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={dateFilter} onValueChange={onDateFilterChange}>
        <SelectTrigger className="w-[200px]">
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
