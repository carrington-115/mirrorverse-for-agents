"use client";

import Image from "next/image";
import { memo, useCallback } from "react";
import { CheckIcon, FileText, Grid2x2, Link2, MessageCircle, Phone, Upload, X } from "lucide-react";

import { ModelSelectorLogo, ModelSelectorName } from "@mirrorverse/ui/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@mirrorverse/ui/ai-elements/prompt-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CHAT_MODELS } from "@/features/chat/config";

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatPromptInputProps {
  onSubmit: (message: PromptInputMessage) => void;
  status: ChatStatus;
  onStop: () => void;
  model: string;
  onModelChange: (model: string) => void;
}

export function ChatPromptInput({
  onSubmit,
  status,
  onStop,
  model,
  onModelChange,
}: ChatPromptInputProps) {
  return (
    <PromptInputProvider>
      <PromptInput globalDrop multiple onSubmit={onSubmit}>
        <AttachmentsBar />
        <PromptInputBody>
          <PromptInputTextarea autoFocus placeholder="How can I help you today?" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent className="w-56">
                <UploadFileMenuItem />
                <PromptInputActionAddScreenshot className="py-2.5 px-3" />
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-2.5 px-3">
                    <Link2 className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    Connect integration
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    <DropdownMenuItem className="py-2.5 px-3">
                      <Link2 className="mr-2 size-4 shrink-0 text-muted-foreground" />
                      Connect webhook
                    </DropdownMenuItem>
                    <DropdownMenuItem className="py-2.5 px-3">
                      <Grid2x2 className="mr-2 size-4 shrink-0 text-muted-foreground" />
                      Connect app
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-2.5 px-3">
                    <MessageCircle className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    Add channel
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    <DropdownMenuItem className="py-2.5 px-3">
                      <Phone className="mr-2 size-4 shrink-0 text-muted-foreground" />
                      Connect phone
                    </DropdownMenuItem>
                    <DropdownMenuItem className="py-2.5 px-3">
                      <MessageCircle className="mr-2 size-4 shrink-0 text-muted-foreground" />
                      Connect WhatsApp number
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <ChatModelPicker selectedId={model} onSelect={onModelChange} />
          </PromptInputTools>
          <PromptInputSubmit status={status} onStop={onStop} className="rounded-full" />
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
  );
}

function AttachmentsBar() {
  const attachments = usePromptInputAttachments();
  const handleRemove = useCallback((id: string) => attachments.remove(id), [attachments]);
  if (attachments.files.length === 0) return null;
  return (
    <div className="gap-2 px-3 pt-3 flex flex-wrap">
      {attachments.files.map((file) => (
        <AttachmentChip key={file.id} attachment={file} onRemove={handleRemove} />
      ))}
    </div>
  );
}

function UploadFileMenuItem() {
  const attachments = usePromptInputAttachments();
  const handleSelect = useCallback(
    (e: Event) => {
      e.preventDefault();
      attachments.openFileDialog();
    },
    [attachments],
  );
  return (
    <DropdownMenuItem className="py-2.5 px-3" onSelect={handleSelect}>
      <Upload className="mr-2 size-4 shrink-0 text-muted-foreground" />
      Upload file
    </DropdownMenuItem>
  );
}

type AttachmentFile = ReturnType<typeof usePromptInputAttachments>["files"][number];

const AttachmentChip = memo(function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: AttachmentFile;
  onRemove: (id: string) => void;
}) {
  const handleRemove = useCallback(() => onRemove(attachment.id), [onRemove, attachment.id]);
  const isImage = attachment.mediaType?.startsWith("image/");

  if (isImage && attachment.url) {
    return (
      <div className="group size-20 relative flex-none overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          alt={attachment.filename || "Image"}
          className="object-cover"
          fill
          src={attachment.url}
          unoptimized
        />
        <button
          aria-label="Remove attachment"
          className="right-1 top-1 size-5 absolute flex items-center justify-center rounded-full bg-background/80 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background"
          onClick={handleRemove}
          type="button"
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="group max-w-52 gap-2.5 py-2.5 pl-3 pr-9 relative flex items-center rounded-xl border border-border bg-muted/40">
      <div className="size-8 flex shrink-0 items-center justify-center rounded-lg bg-background">
        <FileText className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium leading-tight truncate">
          {attachment.filename || "File"}
        </p>
        <p className="mt-0.5 text-xs truncate text-muted-foreground">
          {fileTypeName(attachment.mediaType)}
        </p>
      </div>
      <button
        aria-label="Remove attachment"
        className="right-2 size-5 absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent"
        onClick={handleRemove}
        type="button"
      >
        <X className="size-3" />
      </button>
    </div>
  );
});

function fileTypeName(mediaType: string | undefined): string {
  if (!mediaType) return "File";
  if (mediaType.includes("pdf")) return "PDF";
  if (mediaType.includes("word") || mediaType.includes("docx")) return "Word document";
  if (mediaType.includes("sheet") || mediaType.includes("csv")) return "Spreadsheet";
  if (mediaType.startsWith("text/plain")) return "Text file";
  if (mediaType.includes("json")) return "JSON";
  return "File";
}

function ChatModelPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected = CHAT_MODELS.find((m) => m.id === selectedId) ?? CHAT_MODELS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PromptInputButton>
          <ModelSelectorLogo provider={selected.chefSlug} />
          <ModelSelectorName>{selected.name}</ModelSelectorName>
        </PromptInputButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {CHAT_MODELS.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="gap-3 py-3 items-start"
          >
            <ModelSelectorLogo provider={m.chefSlug} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{m.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
            </div>
            {selectedId === m.id && <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
