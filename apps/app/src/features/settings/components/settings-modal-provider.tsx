"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { SettingsModalContext, type SettingsPage } from "../hooks/use-settings-modal";

export function SettingsModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePage, setActivePage] = useState<SettingsPage>("general");

  const openSettings = (page: SettingsPage = "general") => {
    setActivePage(page);
    setIsOpen(true);
  };

  return (
    <SettingsModalContext.Provider
      value={{
        isOpen,
        activePage,
        openSettings,
        closeSettings: () => setIsOpen(false),
        navigateTo: setActivePage,
      }}
    >
      {children}
    </SettingsModalContext.Provider>
  );
}
