"use client";

import Image from "next/image";
import { Fragment, memo, useCallback, useState, type ReactNode } from "react";
import {
  CheckIcon,
  FileText,
  Grid2x2,
  Link2,
  Loader2,
  Mic,
  MicOff,
  Phone,
  Radio,
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
  usePromptInputController,
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
import { useSpeechToText } from "@/features/chat/hooks/use-speech-to-text";

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatPromptInputProps {
  onSubmit: (message: PromptInputMessage) => void;
  status: ChatStatus;
  onStop: () => void;
  model: string;
  onModelChange: (model: string) => void;
  onConnectApp?: () => void;
  onConnectWebhook?: () => void;
}

export function ChatPromptInput({
  onSubmit,
  status,
  onStop,
  model,
  onModelChange,
  onConnectApp,
  onConnectWebhook,
}: ChatPromptInputProps) {
  return (
    <PromptInputProvider>
      <PromptInput globalDrop multiple onSubmit={onSubmit}>
        <AttachmentsBar />
        <PromptInputBody>
          <PromptInputTextarea
            autoFocus
            placeholder="How can I help you today?"
            className="min-h-14 pt-3 md:text-[14.6px]"
          />
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
                    <DropdownMenuItem className="py-2.5 px-3" onSelect={() => onConnectWebhook?.()}>
                      <Link2 className="mr-2 size-4 shrink-0 text-muted-foreground" />
                      Connect webhook
                    </DropdownMenuItem>
                    <DropdownMenuItem className="py-2.5 px-3" onSelect={() => onConnectApp?.()}>
                      <Grid2x2 className="mr-2 size-4 shrink-0 text-muted-foreground" />
                      Connect app
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-2.5 px-3">
                    <Radio className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    Add channel
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    <ChannelMenuItem
                      icon={<Phone className="mr-2 size-4 shrink-0 text-muted-foreground" />}
                      text="Connect me to a phone number"
                      label="Connect phone"
                    />
                    <ChannelMenuItem
                      icon={<WhatsAppIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />}
                      text="Connect me to a WhatsApp number"
                      label="Connect WhatsApp number"
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <ChatModelPicker selectedId={model} onSelect={onModelChange} />
          </PromptInputTools>
          <div className="gap-1 flex items-center">
            <MicButton />
            <PromptInputSubmit status={status} onStop={onStop} className="rounded-full" />
          </div>
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
  );
}

function MicButton() {
  const controller = usePromptInputController();
  const handleTranscript = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const current = controller.textInput.value;
      controller.textInput.setInput(current ? `${current} ${trimmed}` : trimmed);
    },
    [controller],
  );
  const { state, toggle } = useSpeechToText(handleTranscript);
  const isRecording = state === "recording";
  const isTranscribing = state === "transcribing";

  return (
    <PromptInputButton
      disabled={isTranscribing}
      onClick={toggle}
      tooltip={isRecording ? "Stop recording" : "Voice input"}
      className={cn(isRecording && "text-destructive")}
    >
      {isTranscribing ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="size-4" />
      ) : (
        <Mic className="size-4" />
      )}
    </PromptInputButton>
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

function ChannelMenuItem({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  const controller = usePromptInputController();
  const handleSelect = useCallback(
    (e: Event) => {
      e.preventDefault();
      controller.textInput.setInput(text);
    },
    [controller, text],
  );
  return (
    <DropdownMenuItem className="py-2.5 px-3" onSelect={handleSelect}>
      {icon}
      {label}
    </DropdownMenuItem>
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
