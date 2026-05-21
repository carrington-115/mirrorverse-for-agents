"use client";

import { createContext, useContext } from "react";

export type SettingsPage =
  | "general"
  | "pricing"
  | "billing"
  | "usage"
  | "security"
  | "apps"
  | "channels"
  | "profile";

export interface SettingsModalContextValue {
  isOpen: boolean;
  activePage: SettingsPage;
  openSettings: (page?: SettingsPage) => void;
  closeSettings: () => void;
  navigateTo: (page: SettingsPage) => void;
}

export const SettingsModalContext = createContext<SettingsModalContextValue | null>(null);

export function useSettingsModal() {
  const ctx = useContext(SettingsModalContext);
  if (!ctx) throw new Error("useSettingsModal must be used within SettingsModalProvider");
  return ctx;
}
