import { Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface KnowledgeBaseEmptyProps {
  onAddContent?: () => void;
}

export function KnowledgeBaseEmpty({ onAddContent }: KnowledgeBaseEmptyProps) {
  return (
    <Empty className="py-16 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Folder />
        </EmptyMedia>
        <EmptyTitle>No knowledge base content yet</EmptyTitle>
        <EmptyDescription>
          Add URLs, text, or files to build your knowledge base. Your agents will use this content
          to answer questions and complete tasks.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {onAddContent && (
          <Button onClick={onAddContent} className="cursor-pointer">
            Add Knowledge Base
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
