"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { PRICING_MODAL_EVENT } from "@/features/billing/lib/plan-limit-error";
import { SettingsModalContext, type SettingsPage } from "../hooks/use-settings-modal";

export function SettingsModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePage, setActivePage] = useState<SettingsPage>("general");

  const openSettings = (page: SettingsPage = "general") => {
    setActivePage(page);
    setIsOpen(true);
  };

  useEffect(() => {
    const handlePricingRequest = () => openSettings("pricing");
    window.addEventListener(PRICING_MODAL_EVENT, handlePricingRequest);
    return () => window.removeEventListener(PRICING_MODAL_EVENT, handlePricingRequest);
  }, []);

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
