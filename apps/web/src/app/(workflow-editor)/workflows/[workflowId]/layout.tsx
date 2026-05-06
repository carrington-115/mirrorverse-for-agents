export default function WorkflowEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-background flex flex-col">
      {children}
    </div>
  );
}
