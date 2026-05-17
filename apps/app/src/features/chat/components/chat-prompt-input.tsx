"use client";

import Image from "next/image";
import { Fragment, memo, useCallback, useState } from "react";
import {
  CheckIcon,
  FileText,
  Grid2x2,
  Link2,
  MessageCircle,
  Phone,
  Search,
  Upload,
  X,
} from "lucide-react";

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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { CHAT_MODELS, type ModelOption } from "@/features/chat/config";

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

const ALL_PROVIDER = "All" as const;

const PROVIDERS = [
  { chef: "Anthropic", slug: "anthropic" },
  { chef: "OpenAI", slug: "openai" },
  { chef: "Google", slug: "google" },
] as const;

function ChatModelPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const allModels: readonly ModelOption[] = CHAT_MODELS;
  const selected = allModels.find((m) => m.id === selectedId) ?? allModels[0];
  const [open, setOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>(ALL_PROVIDER);
  const [search, setSearch] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (next) setActiveProvider(ALL_PROVIDER);
    setSearch("");
    setOpen(next);
  };

  const providerModels = allModels.filter(
    (m) =>
      (activeProvider === ALL_PROVIDER || m.chef === activeProvider) &&
      (search === "" ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())),
  );

  const searchPlaceholder =
    activeProvider === ALL_PROVIDER ? "Search all models…" : `Search ${activeProvider} models…`;

  const seriesOrder: string[] = [];
  for (const m of providerModels) {
    if (m.series !== undefined && !seriesOrder.includes(m.series)) {
      seriesOrder.push(m.series);
    }
  }

  // When showing all providers, group by chef instead of series
  const chefOrder: string[] = [];
  if (activeProvider === ALL_PROVIDER) {
    for (const m of providerModels) {
      if (!chefOrder.includes(m.chef)) chefOrder.push(m.chef);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <PromptInputButton>
          <ModelSelectorLogo provider={selected.chefSlug} />
          <ModelSelectorName>{selected.name}</ModelSelectorName>
        </PromptInputButton>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="h-80 gap-0 p-0 w-[480px] flex-row overflow-hidden"
      >
        {/* Left provider sidebar */}
        <div className="w-36 gap-0.5 p-2 flex h-full shrink-0 flex-col border-r border-border">
          <p className="px-2 pb-1.5 pt-1 font-semibold tracking-wider text-[10px] text-muted-foreground/60 uppercase">
            Providers
          </p>
          {/* All models section */}
          <button
            type="button"
            onClick={() => {
              setActiveProvider(ALL_PROVIDER);
              setSearch("");
            }}
            className={cn(
              "gap-2.5 px-2.5 py-2 text-sm flex w-full items-center rounded-lg text-left transition-colors hover:bg-accent/60",
              activeProvider === ALL_PROVIDER
                ? "font-medium bg-accent text-foreground"
                : "text-muted-foreground",
            )}
          >
            <Grid2x2 className="size-4 shrink-0" />
            All
          </button>
          {PROVIDERS.map(({ chef, slug }) => (
            <button
              key={chef}
              type="button"
              onClick={() => {
                setActiveProvider(chef);
                setSearch("");
              }}
              className={cn(
                "gap-2.5 px-2.5 py-2 text-sm flex w-full items-center rounded-lg text-left transition-colors hover:bg-accent/60",
                activeProvider === chef
                  ? "font-medium bg-accent text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <ModelSelectorLogo provider={slug} className="size-4 shrink-0" />
              {chef}
            </button>
          ))}
        </div>

        {/* Right panel — search + scrollable model list */}
        <div className="min-h-0 min-w-0 flex flex-1 flex-col">
          {/* Search */}
          <div className="gap-2 px-3 py-2 flex shrink-0 items-center border-b border-border">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              className="text-sm flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Scrollable model list */}
          <div className="min-h-0 p-1.5 flex-1 overflow-y-auto">
            {providerModels.length === 0 ? (
              <p className="py-8 text-sm text-center text-muted-foreground">No models found</p>
            ) : activeProvider === ALL_PROVIDER ? (
              chefOrder.map((chef) => (
                <Fragment key={chef}>
                  <p className="px-2 pb-0.5 pt-2 font-semibold tracking-wider text-[10px] text-muted-foreground/60 uppercase">
                    {chef}
                  </p>
                  {providerModels
                    .filter((m) => m.chef === chef)
                    .map((m) => (
                      <ModelItem
                        key={m.id}
                        model={m}
                        selected={selectedId === m.id}
                        onSelect={() => {
                          onSelect(m.id);
                          setOpen(false);
                        }}
                      />
                    ))}
                </Fragment>
              ))
            ) : seriesOrder.length > 0 ? (
              seriesOrder.map((series) => (
                <Fragment key={series}>
                  <p className="px-2 pb-0.5 pt-2 font-semibold tracking-wider text-[10px] text-muted-foreground/60 uppercase">
                    {series}
                  </p>
                  {providerModels
                    .filter((m) => m.series === series)
                    .map((m) => (
                      <ModelItem
                        key={m.id}
                        model={m}
                        selected={selectedId === m.id}
                        onSelect={() => {
                          onSelect(m.id);
                          setOpen(false);
                        }}
                      />
                    ))}
                </Fragment>
              ))
            ) : (
              providerModels.map((m) => (
                <ModelItem
                  key={m.id}
                  model={m}
                  selected={selectedId === m.id}
                  onSelect={() => {
                    onSelect(m.id);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ModelItem({
  model,
  selected,
  onSelect,
}: {
  model: ModelOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "gap-0 px-2.5 py-2 flex w-full items-start rounded-lg text-left transition-colors hover:bg-accent/60",
        selected && "bg-accent/50",
      )}
      onClick={onSelect}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-foreground">{model.name}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{model.description}</p>
      </div>
      {selected && <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />}
    </button>
  );
}
