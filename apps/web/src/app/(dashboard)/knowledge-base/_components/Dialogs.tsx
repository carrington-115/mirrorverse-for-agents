"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CloudUpload,
  Folder,
  Monitor,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  Shared folder selector used in all four dialogs                   */
/* ------------------------------------------------------------------ */

function FolderSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Select folder</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a folder">
            <Folder className="size-4 text-muted-foreground" />
            {value || "Knowledge base"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Knowledge base">
            <Folder className="size-4" />
            Knowledge base
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/* ================================================================== */
/*  1. Add URL Dialog                                                 */
/* ================================================================== */

interface AddUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: { folder: string; url: string }) => void;
}

export function AddUrlDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddUrlDialogProps) {
  const [folder, setFolder] = useState("Knowledge base");
  const [url, setUrl] = useState("");

  function handleSubmit() {
    onSubmit?.({ folder, url });
    setUrl("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add URL</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FolderSelect value={folder} onChange={setFolder} />

          <div className="flex flex-col gap-2">
            <Label>Add URL</Label>
            <Input
              id="add-url-input"
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="flex-1 cursor-pointer"
            onClick={handleSubmit}
            disabled={!url.trim()}
          >
            Add URL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/*  2. Add Text Dialog                                                */
/* ================================================================== */

interface AddTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: {
    folder: string;
    name: string;
    content: string;
  }) => void;
}

export function AddTextDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddTextDialogProps) {
  const [folder, setFolder] = useState("Knowledge base");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  function handleSubmit() {
    onSubmit?.({ folder, name, content });
    setName("");
    setContent("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add text</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FolderSelect value={folder} onChange={setFolder} />

          <div className="flex flex-col gap-2">
            <Label>Text name</Label>
            <Input
              id="add-text-name"
              placeholder="URL"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Text content</Label>
            <Textarea
              id="add-text-content"
              placeholder="Type your message here."
              className="min-h-[100px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="flex-1 cursor-pointer"
            onClick={handleSubmit}
            disabled={!name.trim() || !content.trim()}
          >
            Add text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/*  3. Add File Dialog                                                */
/* ================================================================== */

const SUPPORTED_FORMATS = [
  "PDF",
  "CSV",
  "TXT",
  "HTML",
  "DOCX",
  "XLSX",
  "IMAGES",
] as const;

interface AddFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: { folder: string; source: string; files: File[] }) => void;
}

export function AddFileDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddFileDialogProps) {
  const [folder, setFolder] = useState("Knowledge base");
  const [source, setSource] = useState("From computer");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((prev) => [...prev, ...Array.from(incoming)]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  function handleSubmit() {
    onSubmit?.({ folder, source, files });
    setFiles([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add file</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FolderSelect value={folder} onChange={setFolder} />

          <div className="flex flex-col gap-2">
            <Label>Select source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <Monitor className="size-4 text-muted-foreground" />
                  {source}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="From computer">
                  <Monitor className="size-4" />
                  From computer
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload drop-zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3",
              "rounded-xl border border-dashed border-border",
              "px-6 py-10 text-center",
              "cursor-pointer transition-colors",
              isDragging && "border-primary bg-primary/5",
            )}
          >
            <CloudUpload className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Click or drag files to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Up to 20MB each
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUPPORTED_FORMATS.map((fmt) => (
                <Badge
                  key={fmt}
                  variant="outline"
                  className="text-[11px] font-medium"
                >
                  {fmt}
                </Badge>
              ))}
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.csv,.txt,.html,.docx,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Show selected file names */}
          {files.length > 0 && (
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {files.map((f, i) => (
                <span key={i}>
                  {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="flex-1 cursor-pointer"
            onClick={handleSubmit}
            disabled={files.length === 0}
          >
            Add file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/*  4. Create Folder Dialog                                           */
/* ================================================================== */

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: { parentFolder: string; folderName: string }) => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateFolderDialogProps) {
  const [parentFolder, setParentFolder] = useState("Knowledge base");
  const [folderName, setFolderName] = useState("");

  function handleSubmit() {
    onSubmit?.({ parentFolder, folderName });
    setFolderName("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create folder</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FolderSelect value={parentFolder} onChange={setParentFolder} />

          <div className="flex flex-col gap-2">
            <Label>Folder name</Label>
            <Input
              id="create-folder-name"
              placeholder="Name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="flex-1 cursor-pointer"
            onClick={handleSubmit}
            disabled={!folderName.trim()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
