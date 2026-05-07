"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Globe, Type, FileText, FolderOpen } from "lucide-react";
import { KnowledgeBaseCard } from "./_components/knowledge-base-card";
import { KnowledgeBaseTable } from "./_components/knowledge-base-table";
import {
  AddUrlDialog,
  AddTextDialog,
  AddFileDialog,
  CreateFolderDialog,
} from "./_components/dialogs";
import type { KnowledgeBaseProps, KnowledgeBaseItem } from "@/lib/types";

const SAMPLE_ITEMS: KnowledgeBaseItem[] = [
  {
    id: "1",
    name: "Inventory inquiry agent",
    url: "https://mirrro.ai",
    createdBy: { name: "Melvis" },
    totalRagSearch: 47,
    fileType: "URL",
    lastUpdated: new Date("2025-12-24T12:04:00"),
  },
  {
    id: "2",
    name: "Company support policy document",
    createdBy: { name: "Melvis" },
    totalRagSearch: 102,
    fileType: "File",
    lastUpdated: new Date("2025-12-24T12:04:00"),
  },
];

export default function KnowledgeBase({
  urlCount = 10,
  textCount = "200+",
  fileCount = "100+",
  folderCount = 25,
  className,
}: KnowledgeBaseProps) {
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [addTextOpen, setAddTextOpen] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  return (
    <div className="w-full">
      <div className={cn("gap-4 flex w-[70%] flex-col", className)}>
        <div className="gap-3 flex items-center">
          <h2 className="text-xl font-semibold text-foreground">Knowledge base</h2>
        </div>

        <div className="gap-3 flex">
          <KnowledgeBaseCard
            icon={<Globe className="size-6" />}
            label="Add URL"
            count={urlCount}
            badgeVariant="green"
            onClick={() => setAddUrlOpen(true)}
          />
          <KnowledgeBaseCard
            icon={<Type className="size-6" />}
            label="Add text"
            count={textCount}
            badgeVariant="blue"
            onClick={() => setAddTextOpen(true)}
          />
          <KnowledgeBaseCard
            icon={<FileText className="size-6" />}
            label="Add files"
            count={fileCount}
            badgeVariant="red"
            onClick={() => setAddFileOpen(true)}
          />
          <KnowledgeBaseCard
            icon={<FolderOpen className="size-6" />}
            label="Create folder"
            count={folderCount}
            badgeVariant="amber"
            onClick={() => setCreateFolderOpen(true)}
          />
        </div>
      </div>

      {/* Search + Data table */}
      <KnowledgeBaseTable items={SAMPLE_ITEMS} className="mt-6" />

      {/* Dialogs */}
      <AddUrlDialog open={addUrlOpen} onOpenChange={setAddUrlOpen} />
      <AddTextDialog open={addTextOpen} onOpenChange={setAddTextOpen} />
      <AddFileDialog open={addFileOpen} onOpenChange={setAddFileOpen} />
      <CreateFolderDialog open={createFolderOpen} onOpenChange={setCreateFolderOpen} />
    </div>
  );
}
