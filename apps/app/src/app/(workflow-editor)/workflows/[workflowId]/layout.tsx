export default function WorkflowEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">{children}</div>
  );
}
