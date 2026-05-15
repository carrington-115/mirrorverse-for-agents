import { Separator } from "@/components/ui/separator";
import { buildMetadata } from "@/lib/seo/metadata";
import { AuditLogsShell } from "@/features/audit-log/components/audit-logs-shell";

export const metadata = buildMetadata({
  title: "Audit Log",
  description: "Track workspace activity for compliance and debugging.",
  noIndex: true,
});

export function AuditLogsPage() {
  return (
    <div className="gap-6 max-w-4xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Track who did what and when across your workspace.
        </p>
      </div>
      <Separator />
      <AuditLogsShell />
    </div>
  );
}
