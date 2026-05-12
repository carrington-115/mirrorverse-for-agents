interface RecommendationCardProps {
  title: string;
  description: string;
  onClick: () => void;
}

export function RecommendationCard({ title, description, onClick }: RecommendationCardProps) {
  return (
    <button
      onClick={onClick}
      className="gap-0.5 px-3 py-4 flex flex-1 cursor-pointer flex-col self-stretch rounded-lg border border-border bg-background text-left transition-colors hover:bg-secondary/50"
    >
      <span className="text-base font-semibold leading-6 text-foreground">{title}</span>
      <span className="text-xs leading-4 text-muted-foreground">{description}</span>
    </button>
  );
}
