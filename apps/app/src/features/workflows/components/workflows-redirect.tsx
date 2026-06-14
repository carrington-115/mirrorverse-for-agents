"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettingsModal } from "@/features/settings/hooks/use-settings-modal";

// The workflows list now lives in the settings modal's "Workflows" tab.
// This route stays around for existing links (sidebar, command menu, editor
// "back" / delete redirects) and just opens that tab in place.
export function WorkflowsRedirect() {
  const router = useRouter();
  const { openSettings } = useSettingsModal();

  useEffect(() => {
    openSettings("workflows");
    router.replace("/");
  }, []);

  return null;
}
