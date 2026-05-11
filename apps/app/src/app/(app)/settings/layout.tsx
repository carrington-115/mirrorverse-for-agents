import { SettingsShellLayout } from "@/features/settings/components/settings-shell-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SettingsShellLayout>{children}</SettingsShellLayout>;
}
