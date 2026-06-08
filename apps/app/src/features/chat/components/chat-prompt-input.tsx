"use client";

import Image from "next/image";
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
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
  Zap,
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { CHAT_MODELS, type ModelOption } from "@/features/chat/config";
import { useSpeechToText } from "@/features/chat/hooks/use-speech-to-text";
import { PlanProgressBar, type PlanProgressStep } from "./plan-progress-bar";
import { TriggerPickerButton, type SessionTriggerInfo } from "./trigger-picker";

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatPromptInputProps {
  onSubmit: (message: PromptInputMessage) => void;
  status: ChatStatus;
  onStop: () => void;
  model: string;
  onModelChange: (model: string) => void;
  onConnectApp?: () => void;
  onConnectWebhook?: () => void;
  planSteps?: PlanProgressStep[];
  sessionTriggers?: SessionTriggerInfo[];
  fillInputRef?: MutableRefObject<((text: string) => void) | null>;
  compact?: boolean;
}

function SetInputBridge({
  fillInputRef,
}: {
  fillInputRef: MutableRefObject<((text: string) => void) | null>;
}) {
  const controller = usePromptInputController();
  const setInput = controller.textInput.setInput;
  useEffect(() => {
    fillInputRef.current = setInput;
    return () => {
      fillInputRef.current = null;
    };
  }, [fillInputRef, setInput]);
  return null;
}

// Only ever signals "should expand" — never collapse. Collapse is handled by ValueResetWatcher.
function LayoutExpansionWatcher({ onExpand }: { onExpand: () => void }) {
  const controller = usePromptInputController();
  const value = controller.textInput.value;
  useEffect(() => {
    if (!value) return;
    const textarea = document.querySelector<HTMLTextAreaElement>(
      '[data-slot="input-group-control"]',
    );
    if (!textarea) return;
    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    const wasFocused = document.activeElement === textarea;
    const prevMinHeight = textarea.style.minHeight;
    const prevValue = textarea.value;
    textarea.style.minHeight = "0px";
    textarea.value = "";
    const singleRowHeight = textarea.scrollHeight;
    textarea.value = prevValue;
    const contentHeight = textarea.scrollHeight;
    textarea.style.minHeight = prevMinHeight;
    if (wasFocused) textarea.setSelectionRange(selStart, selEnd);
    if (contentHeight > singleRowHeight) onExpand();
  }, [value, onExpand]);
  return null;
}

// Collapses back to single-line when the textarea is cleared (after submit or manual erase).
function ValueResetWatcher({ onReset }: { onReset: () => void }) {
  const controller = usePromptInputController();
  const value = controller.textInput.value;
  useEffect(() => {
    if (value === "") onReset();
  }, [value, onReset]);
  return null;
}

export function ChatPromptInput({
  onSubmit,
  status,
  onStop,
  model,
  onModelChange,
  onConnectApp,
  onConnectWebhook,
  planSteps = [],
  sessionTriggers = [],
  fillInputRef,
  compact = false,
}: ChatPromptInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileTriggerDialogOpen, setMobileTriggerDialogOpen] = useState(false);
  const [mobileModelDrawerOpen, setMobileModelDrawerOpen] = useState(false);
  const [mobileTriggerDrawerOpen, setMobileTriggerDrawerOpen] = useState(false);
  const [mobileIntegrationDrawerOpen, setMobileIntegrationDrawerOpen] = useState(false);
  const [mobileChannelDrawerOpen, setMobileChannelDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const cursorRef = useRef<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });
  const isExpandedRef = useRef(isExpanded);
  useLayoutEffect(() => {
    isExpandedRef.current = isExpanded;
  });

  const handleExpand = useCallback(() => {
    if (isExpandedRef.current) return;
    const textarea = document.querySelector<HTMLTextAreaElement>(
      '[data-slot="input-group-control"]',
    );
    if (textarea) {
      cursorRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd };
    }
    setIsExpanded(true);
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  useEffect(() => {
    const { start, end } = cursorRef.current;
    if (start !== null && end !== null) {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        '[data-slot="input-group-control"]',
      );
      if (textarea) {
        textarea.setSelectionRange(start, end);
      }
      cursorRef.current = { start: null, end: null };
    }
  }, [isExpanded]);
  const selectedModel = CHAT_MODELS.find((m) => m.id === model) ?? CHAT_MODELS[0];
  const attachTooltip = {
    content: (
      <div className="space-y-1.5">
        <p className="font-medium text-xs">Attach &amp; connect</p>
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          <li>Images, screenshots &amp; documents</li>
          <li>Phone numbers</li>
          <li>Webhooks &amp; integrations</li>
        </ul>
      </div>
    ),
    side: "top" as const,
  };

  const attachMenuContent = (
    <PromptInputActionMenuContent className="w-56">
      {/* Mobile-only model selector — opens drawer */}
      <DropdownMenuItem
        className="md:hidden py-2.5 px-3"
        onSelect={() => setMobileModelDrawerOpen(true)}
      >
        <ModelSelectorLogo provider={selectedModel.chefSlug} className="mr-2 size-4 shrink-0" />
        {selectedModel.name}
      </DropdownMenuItem>
      {/* Mobile-only trigger item — opens trigger drawer */}
      <DropdownMenuItem
        className="md:hidden py-2.5 px-3"
        onSelect={() => setMobileTriggerDrawerOpen(true)}
      >
        <Zap className="mr-2 size-4 shrink-0 text-muted-foreground" />
        {sessionTriggers.length > 0 ? `Triggers (${sessionTriggers.length})` : "Add trigger"}
      </DropdownMenuItem>
      <DropdownMenuSeparator className="md:hidden" />
      <UploadFileMenuItem />
      {/* Screenshot — hidden on mobile */}
      {!isMobile && <PromptInputActionAddScreenshot className="py-2.5 px-3" />}
      <DropdownMenuSeparator />
      {/* Integration — drawer on mobile, sub-menu on desktop */}
      {isMobile ? (
        <DropdownMenuItem
          className="py-2.5 px-3"
          onSelect={() => setMobileIntegrationDrawerOpen(true)}
        >
          <Link2 className="mr-2 size-4 shrink-0 text-muted-foreground" />
          Connect integration
        </DropdownMenuItem>
      ) : (
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
      )}
      {/* Channel — drawer on mobile, sub-menu on desktop */}
      {isMobile ? (
        <DropdownMenuItem className="py-2.5 px-3" onSelect={() => setMobileChannelDrawerOpen(true)}>
          <Radio className="mr-2 size-4 shrink-0 text-muted-foreground" />
          Add channel
        </DropdownMenuItem>
      ) : (
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
      )}
    </PromptInputActionMenuContent>
  );

  const mobileDrawers = (
    <>
      <MobileModelDrawer
        open={mobileModelDrawerOpen}
        onOpenChange={setMobileModelDrawerOpen}
        selectedId={model}
        onSelect={onModelChange}
      />
      <MobileIntegrationDrawer
        open={mobileIntegrationDrawerOpen}
        onOpenChange={setMobileIntegrationDrawerOpen}
        onConnectWebhook={onConnectWebhook}
        onConnectApp={onConnectApp}
      />
      <MobileChannelDrawer
        open={mobileChannelDrawerOpen}
        onOpenChange={setMobileChannelDrawerOpen}
      />
    </>
  );

  if (compact) {
    return (
      <PromptInputProvider>
        {fillInputRef && <SetInputBridge fillInputRef={fillInputRef} />}
        <LayoutExpansionWatcher onExpand={handleExpand} />
        <ValueResetWatcher onReset={handleCollapse} />
        <PlanProgressBar steps={planSteps} />
        {/* Attachments render above the pill when collapsed, inside the card when expanded */}
        {!isExpanded && <AttachmentsBar />}
        <PromptInput
          globalDrop
          multiple
          onSubmit={onSubmit}
          className={cn(
            "[&_[data-slot=input-group]]:ease-out [&_[data-slot=input-group]]:transition-all [&_[data-slot=input-group]]:duration-300",
            isExpanded
              ? "[&_[data-slot=input-group]]:rounded-2xl"
              : "[&_[data-slot=input-group]]:rounded-full",
          )}
        >
          {isExpanded && <AttachmentsBar />}
          {!isExpanded && (
            <div className="py-3 pl-2.5 flex shrink-0 items-center">
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger tooltip={attachTooltip} />
                {attachMenuContent}
              </PromptInputActionMenu>
            </div>
          )}
          <PromptInputTextarea
            autoFocus
            placeholder="How can I help you today?"
            className={cn(
              "md:text-[14.6px]",
              isExpanded ? "min-h-10 px-3 py-3" : "min-h-10 max-h-48 py-2.5 px-2",
            )}
          />
          {!isExpanded && (
            <div className="gap-0.5 py-1.5 pr-2.5 flex shrink-0 items-center">
              <div className="md:contents hidden">
                <ChatModelPicker
                  selectedId={model}
                  onSelect={onModelChange}
                  onMobileTrigger={() => setMobileModelDrawerOpen(true)}
                />
                <TriggerPickerButton
                  triggers={sessionTriggers}
                  externalDialogOpen={mobileTriggerDialogOpen}
                  onExternalDialogOpenChange={setMobileTriggerDialogOpen}
                  externalDrawerOpen={mobileTriggerDrawerOpen}
                  onExternalDrawerOpenChange={setMobileTriggerDrawerOpen}
                />
              </div>
              <MicButton />
              <PromptInputSubmit status={status} onStop={onStop} className="rounded-full" />
            </div>
          )}
          {isExpanded && (
            <PromptInputFooter className="animate-in duration-200 fade-in slide-in-from-bottom-1">
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger tooltip={attachTooltip} />
                  {attachMenuContent}
                </PromptInputActionMenu>
                <ChatModelPicker
                  selectedId={model}
                  onSelect={onModelChange}
                  onMobileTrigger={() => setMobileModelDrawerOpen(true)}
                />
              </PromptInputTools>
              <div className="gap-1 flex items-center">
                <TriggerPickerButton triggers={sessionTriggers} />
                <MicButton />
                <PromptInputSubmit status={status} onStop={onStop} className="rounded-full" />
              </div>
            </PromptInputFooter>
          )}
        </PromptInput>
        {mobileDrawers}
      </PromptInputProvider>
    );
  }

  return (
    <PromptInputProvider>
      {fillInputRef && <SetInputBridge fillInputRef={fillInputRef} />}
      <PlanProgressBar steps={planSteps} />
      <PromptInput
        globalDrop
        multiple
        onSubmit={onSubmit}
        className="[&_[data-slot=input-group]]:rounded-2xl"
      >
        <AttachmentsBar />
        <PromptInputBody>
          <PromptInputTextarea
            autoFocus
            placeholder="How can I help you today?"
            className="min-h-16 px-3 py-3 md:text-[14.6px]"
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger tooltip={attachTooltip} />
              {attachMenuContent}
            </PromptInputActionMenu>
            <ChatModelPicker
              selectedId={model}
              onSelect={onModelChange}
              onMobileTrigger={() => setMobileModelDrawerOpen(true)}
            />
          </PromptInputTools>
          <div className="gap-1 flex items-center">
            <TriggerPickerButton
              triggers={sessionTriggers}
              externalDrawerOpen={mobileTriggerDrawerOpen}
              onExternalDrawerOpenChange={setMobileTriggerDrawerOpen}
            />
            <MicButton />
            <PromptInputSubmit status={status} onStop={onStop} className="rounded-full" />
          </div>
        </PromptInputFooter>
      </PromptInput>
      {mobileDrawers}
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
      className={cn("rounded-full", isRecording && "text-destructive")}
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
] as const;

function ChatModelPicker({
  selectedId,
  onSelect,
  onMobileTrigger,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onMobileTrigger?: () => void;
}) {
  const allModels: readonly ModelOption[] = CHAT_MODELS;
  const selected = allModels.find((m) => m.id === selectedId) ?? allModels[0];
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>(ALL_PROVIDER);
  const [search, setSearch] = useState("");

  if (isMobile) {
    return (
      <PromptInputButton className="rounded-full" onClick={() => onMobileTrigger?.()}>
        <ModelSelectorLogo provider={selected.chefSlug} />
        <ModelSelectorName>{selected.name}</ModelSelectorName>
      </PromptInputButton>
    );
  }

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
        <PromptInputButton className="rounded-full">
          <ModelSelectorLogo provider={selected.chefSlug} />
          <ModelSelectorName>{selected.name}</ModelSelectorName>
        </PromptInputButton>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="h-80 gap-0 p-0 w-[480px] max-w-[90vw] flex-row overflow-hidden"
      >
        {/* Left provider sidebar */}
        <div className="w-12 gap-0.5 p-2 md:w-36 flex h-full shrink-0 flex-col border-r border-border">
          <p className="px-2 pb-1.5 pt-1 font-semibold tracking-wider md:block hidden text-[10px] text-muted-foreground/60 uppercase">
            Providers
          </p>
          {/* All models section */}
          <button
            type="button"
            aria-label="All"
            title="All"
            onClick={() => {
              setActiveProvider(ALL_PROVIDER);
              setSearch("");
            }}
            className={cn(
              "gap-2.5 px-2.5 py-2 text-sm md:justify-start flex w-full items-center justify-center rounded-full text-left transition-colors hover:bg-accent/60",
              activeProvider === ALL_PROVIDER
                ? "font-medium bg-accent text-foreground"
                : "text-muted-foreground",
            )}
          >
            <Grid2x2 className="size-4 shrink-0" />
            <span className="md:inline hidden">All</span>
          </button>
          {PROVIDERS.map(({ chef, slug }) => (
            <button
              key={chef}
              type="button"
              aria-label={chef}
              title={chef}
              onClick={() => {
                setActiveProvider(chef);
                setSearch("");
              }}
              className={cn(
                "gap-2.5 px-2.5 py-2 text-sm md:justify-start flex w-full items-center justify-center rounded-full text-left transition-colors hover:bg-accent/60",
                activeProvider === chef
                  ? "font-medium bg-accent text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <ModelSelectorLogo provider={slug} className="size-4 md:size-4 shrink-0" />
              <span className="md:inline hidden">{chef}</span>
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
        <p className="gap-1.5 text-sm font-medium leading-snug flex items-center text-foreground">
          {model.name}
          {model.pro && (
            <span className="bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-600 dark:text-amber-400 rounded-full text-[10px]">
              Pro
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{model.description}</p>
      </div>
      {selected && <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />}
    </button>
  );
}

// ─── Mobile drawers ───────────────────────────────────────────────────────────

function MobileModelDrawer({
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const allModels: readonly ModelOption[] = CHAT_MODELS;
  const [search, setSearch] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setSearch("");
    onOpenChange(next);
  };

  const filtered = allModels.filter(
    (m) =>
      search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Select model</DrawerTitle>
        </DrawerHeader>
        <div className="gap-2 px-4 pb-3 flex items-center border-b border-border">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            className="py-1.5 text-sm flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Search models…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pb-6 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-8 text-sm text-center text-muted-foreground">No models found</p>
          ) : (
            PROVIDERS.map(({ chef, slug }) => {
              const models = filtered.filter((m) => m.chef === chef);
              if (models.length === 0) return null;
              return (
                <Fragment key={chef}>
                  <p className="px-4 pb-1 pt-3 font-semibold tracking-wider text-[10px] text-muted-foreground/60 uppercase">
                    {chef}
                  </p>
                  {models.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={cn(
                        "gap-3 px-4 py-3 flex w-full items-center text-left transition-colors hover:bg-accent/60",
                        selectedId === m.id && "bg-accent/50",
                      )}
                      onClick={() => {
                        onSelect(m.id);
                        handleOpenChange(false);
                      }}
                    >
                      <ModelSelectorLogo provider={slug} className="size-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="gap-1.5 text-sm font-medium flex items-center">
                          {m.name}
                          {m.pro && (
                            <span className="bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-600 dark:text-amber-400 rounded-full text-[10px]">
                              Pro
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      {selectedId === m.id && (
                        <CheckIcon className="size-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </Fragment>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MobileIntegrationDrawer({
  open,
  onOpenChange,
  onConnectWebhook,
  onConnectApp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectWebhook?: () => void;
  onConnectApp?: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Connect integration</DrawerTitle>
        </DrawerHeader>
        <div className="p-2 pb-8">
          <button
            type="button"
            className="gap-3 px-4 py-3.5 flex w-full items-center rounded-lg text-left transition-colors hover:bg-accent"
            onClick={() => {
              onOpenChange(false);
              onConnectWebhook?.();
            }}
          >
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Connect webhook</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Trigger via an HTTP request</p>
            </div>
          </button>
          <button
            type="button"
            className="gap-3 px-4 py-3.5 flex w-full items-center rounded-lg text-left transition-colors hover:bg-accent"
            onClick={() => {
              onOpenChange(false);
              onConnectApp?.();
            }}
          >
            <Grid2x2 className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Connect app</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Browse and connect integrations
              </p>
            </div>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MobileChannelDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const controller = usePromptInputController();

  const handleSelect = useCallback(
    (text: string) => {
      controller.textInput.setInput(text);
      onOpenChange(false);
    },
    [controller, onOpenChange],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add channel</DrawerTitle>
        </DrawerHeader>
        <div className="p-2 pb-8">
          <button
            type="button"
            className="gap-3 px-4 py-3.5 flex w-full items-center rounded-lg text-left transition-colors hover:bg-accent"
            onClick={() => handleSelect("Connect me to a phone number")}
          >
            <Phone className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Connect phone</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add a phone number to your agent
              </p>
            </div>
          </button>
          <button
            type="button"
            className="gap-3 px-4 py-3.5 flex w-full items-center rounded-lg text-left transition-colors hover:bg-accent"
            onClick={() => handleSelect("Connect me to a WhatsApp number")}
          >
            <WhatsAppIcon className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Connect WhatsApp number</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add a WhatsApp number to your agent
              </p>
            </div>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
