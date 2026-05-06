import { Button } from "@/components/ui/button";
import { AgentTemplate } from "@/lib/types";
import { toast } from "sonner";

interface AgentTemplateCardProps {
  template: AgentTemplate;
  onUseTemplate?: (template: AgentTemplate) => void;
  onViewDetails?: (template: AgentTemplate) => void;
}

export default function AgentTemplateCard({
  template,
  onUseTemplate,
  onViewDetails,
}: AgentTemplateCardProps) {
  return (
    <div className="min-w-[230px] rounded-lg border border-border bg-card flex flex-col justify-between h-40 px-3 py-4">
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold text-base leading-6 text-foreground">
          {template.name}
        </p>
        <p className="text-xs leading-4 text-card-foreground line-clamp-3">
          {template.description}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          onClick={() =>
            onUseTemplate
              ? onUseTemplate(template)
              : toast.info("Use template coming soon")
          }
        >
          Use template
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onViewDetails
              ? onViewDetails(template)
              : toast.info("View details coming soon")
          }
        >
          View details
        </Button>
      </div>
    </div>
  );
}
