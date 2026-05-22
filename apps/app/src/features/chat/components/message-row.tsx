import { useState } from "react";
import { isReasoningUIPart, isTextUIPart, isToolUIPart, type UIMessage } from "ai";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@mirrorverse/ui/ai-elements/chain-of-thought";
import { Message, MessageContent, MessageResponse } from "@mirrorverse/ui/ai-elements/message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { AssistantAvatar } from "./assistant-avatar";
import { MessageActions } from "./message-actions";
import { WorkflowCommitCard } from "./workflow-commit-card";
import { PhoneNumberSelectionCard } from "./phone-number-selection-card";
import { PhoneNumberProvisionCard } from "./phone-number-provision-card";
import { UnassignedPhoneNumbersCard } from "./unassigned-phone-numbers-card";
import { VoiceAgentActivateCard } from "./voice-agent-activate-card";
import { isWorkflowCommitPart } from "@/features/chat/lib/workflow-commit-tool";
import {
  isPhoneSearchPart,
  isPhoneProvisionPart,
  isByoTwilioPart,
  isUnassignedNumbersPart,
  isVoiceActivatePart,
  type PhoneSearchToolPart,
  type PhoneProvisionToolPart,
  type ByoTwilioToolPart,
  type UnassignedNumbersToolPart,
  type VoiceActivateToolPart,
} from "@/features/chat/lib/phone-tools";

interface MessageRowProps {
  message: UIMessage;
  isLast: boolean;
  isStreaming: boolean;
  canRetry: boolean;
  onEdit: (newText: string) => void;
  onRetry: () => void;
  onWorkflowSelect?: (workflowId: string) => void;
  onPhoneSelect?: (phoneNumber: string) => void;
  onPhoneNumberForVoiceAgent?: (phoneNumberId: string) => void;
  onGetManagedNumber?: () => void;
  onByoTwilio?: () => void;
}

function extractCopyText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("\n\n")
    .trim();
}

export function MessageRow({
  message,
  isLast,
  isStreaming,
  canRetry,
  onEdit,
  onRetry,
  onWorkflowSelect,
  onPhoneSelect,
  onPhoneNumberForVoiceAgent,
  onGetManagedNumber,
  onByoTwilio,
}: MessageRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const initialText = extractCopyText(message);
  const [draft, setDraft] = useState(initialText);

  const reasoningParts = message.parts.filter(isReasoningUIPart);
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLast && isStreaming && lastPart ? isReasoningUIPart(lastPart) : false;

  const handleCopy = () => {
    const text = extractCopyText(message);
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const beginEdit = () => {
    setDraft(extractCopyText(message));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(initialText);
  };

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setIsEditing(false);
    onEdit(trimmed);
  };

  const body = (
    <Message from={message.role}>
      <MessageContent className="text-[14.6px]">
        {reasoningParts.length > 0 ? (
          <ChainOfThought defaultOpen={false}>
            <ChainOfThoughtHeader>
              {isReasoningStreaming ? "Thinking…" : "Thought process"}
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {reasoningParts.map((p, i) => {
                const isLastReasoningStep = i === reasoningParts.length - 1;
                return (
                  <ChainOfThoughtStep
                    key={`${message.id}-r-${i}`}
                    label={p.text}
                    status={isReasoningStreaming && isLastReasoningStep ? "active" : "complete"}
                  />
                );
              })}
            </ChainOfThoughtContent>
          </ChainOfThought>
        ) : null}
        {isEditing && message.role === "user" ? (
          <div className="gap-2 flex w-full flex-col">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  saveEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              autoFocus
              rows={3}
              className="text-sm"
            />
            <div className="gap-2 flex justify-end">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={draft.trim().length === 0}>
                Save and regenerate
              </Button>
            </div>
          </div>
        ) : (
          message.parts.map((part, i) => {
            const key = `${message.id}-${i}`;
            if (isTextUIPart(part)) return <MessageResponse key={key}>{part.text}</MessageResponse>;
            if (isToolUIPart(part) && isWorkflowCommitPart(part)) {
              return (
                <WorkflowCommitCard key={key} part={part} onWorkflowSelect={onWorkflowSelect} />
              );
            }
            if (isToolUIPart(part) && isPhoneSearchPart(part)) {
              return (
                <PhoneNumberSelectionCard
                  key={key}
                  part={part as PhoneSearchToolPart}
                  onPhoneSelect={isLast && !isStreaming ? onPhoneSelect : undefined}
                />
              );
            }
            if (isToolUIPart(part) && (isPhoneProvisionPart(part) || isByoTwilioPart(part))) {
              return (
                <PhoneNumberProvisionCard
                  key={key}
                  part={part as PhoneProvisionToolPart | ByoTwilioToolPart}
                />
              );
            }
            if (isToolUIPart(part) && isUnassignedNumbersPart(part)) {
              return (
                <UnassignedPhoneNumbersCard
                  key={key}
                  part={part as UnassignedNumbersToolPart}
                  onSelect={isLast && !isStreaming ? onPhoneNumberForVoiceAgent : undefined}
                  onGetManagedNumber={isLast && !isStreaming ? onGetManagedNumber : undefined}
                  onByoTwilio={isLast && !isStreaming ? onByoTwilio : undefined}
                />
              );
            }
            if (isToolUIPart(part) && isVoiceActivatePart(part)) {
              return <VoiceAgentActivateCard key={key} part={part as VoiceActivateToolPart} />;
            }
            return null;
          })
        )}
      </MessageContent>
    </Message>
  );

  const showActions = !isEditing && !isStreaming;
  const actions = showActions ? (
    message.role === "user" ? (
      <MessageActions role="user" onCopy={handleCopy} onEdit={beginEdit} />
    ) : canRetry ? (
      <MessageActions role="assistant" onCopy={handleCopy} onRetry={onRetry} />
    ) : null
  ) : null;

  if (message.role === "user") {
    return (
      <div className="group flex w-full flex-col items-end">
        {body}
        {actions}
      </div>
    );
  }

  return (
    <div className="gap-3 group flex w-full">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">
        {body}
        {actions}
      </div>
    </div>
  );
}
