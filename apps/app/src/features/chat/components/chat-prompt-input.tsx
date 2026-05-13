"use client";

import { memo, useCallback, useState } from "react";
import { CheckIcon } from "lucide-react";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@mirrorverse/ui/ai-elements/attachments";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@mirrorverse/ui/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputActionAddAttachments,
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
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
                <PromptInputActionAddScreenshot />
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
    <Attachments variant="inline">
      {attachments.files.map((file) => (
        <AttachmentChip key={file.id} attachment={file} onRemove={handleRemove} />
      ))}
    </Attachments>
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
  return (
    <Attachment data={attachment} onRemove={handleRemove}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  );
});

function ChatModelPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = CHAT_MODELS.find((m) => m.id === selectedId) ?? CHAT_MODELS[0];

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <PromptInputButton>
          <ModelSelectorLogo provider={selected.chefSlug} />
          <ModelSelectorName>{selected.name}</ModelSelectorName>
        </PromptInputButton>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder="Search models…" />
        <ModelSelectorList>
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          <ModelSelectorGroup heading="Anthropic">
            {CHAT_MODELS.map((m) => (
              <ModelOptionRow
                key={m.id}
                model={m}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            ))}
          </ModelSelectorGroup>
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

const ModelOptionRow = memo(function ModelOptionRow({
  model,
  selectedId,
  onSelect,
}: {
  model: ModelOption;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const handleSelect = useCallback(() => onSelect(model.id), [onSelect, model.id]);
  return (
    <ModelSelectorItem onSelect={handleSelect} value={model.id}>
      <ModelSelectorLogo provider={model.chefSlug} />
      <ModelSelectorName>{model.name}</ModelSelectorName>
      {selectedId === model.id ? (
        <CheckIcon className="size-4 ml-auto" />
      ) : (
        <div className="size-4 ml-auto" />
      )}
    </ModelSelectorItem>
  );
});
