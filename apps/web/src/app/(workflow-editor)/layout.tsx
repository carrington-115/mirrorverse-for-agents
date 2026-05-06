import { TooltipProvider } from "@/components/ui/tooltip";

export default function WorkflowEditorGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
