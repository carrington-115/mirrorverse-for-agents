import { useEffect, useRef, useState } from "react";
import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";

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
import { KnowledgeBaseCard } from "./knowledge-base-card";
import { isWorkflowCommitPart } from "@/features/chat/lib/workflow-commit-tool";
import { buildCotTimeline, deriveCotPhase } from "@/features/chat/lib/cot-timeline";
import { isKbViewPart, type KbViewToolPart } from "@/features/chat/lib/knowledge-tools";
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
  onConfirmDocuments?: (documentIds: string[], labels: string[]) => void;
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
  onConfirmDocuments,
}: MessageRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const initialText = extractCopyText(message);
  const [draft, setDraft] = useState(initialText);

  const isLive = isLast && isStreaming;
  const { steps, hasAny } = buildCotTimeline(message);
  const phase = deriveCotPhase(message, isLive);
  const headerLabel =
    phase === "thinking" ? "Thinking…" : phase === "working" ? "Working…" : "Thought process";

  // Open while the assistant works, collapse when the turn finishes — but stop
  // driving the panel once the user has manually toggled it this turn. The
  // override resets when the message stops being live, so the next live turn
  // auto-opens again; historical messages stay collapsed (never live).
  const [cotOpen, setCotOpen] = useState(false);
  const userTouchedRef = useRef(false);

  useEffect(() => {
    if (userTouchedRef.current) return;
    setCotOpen(isLive);
  }, [isLive]);

  useEffect(() => {
    if (!isLive) userTouchedRef.current = false;
  }, [isLive]);

  const handleCotOpenChange = (next: boolean) => {
    userTouchedRef.current = true;
    setCotOpen(next);
  };

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
      <MessageContent className="sm:text-[14.6px] text-[13px]">
        {hasAny ? (
          <ChainOfThought open={cotOpen} onOpenChange={handleCotOpenChange}>
            <ChainOfThoughtHeader>{headerLabel}</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {steps.map((step, i) => {
                const isLastStep = i === steps.length - 1;
                if (step.kind === "reasoning") {
                  return (
                    <ChainOfThoughtStep
                      key={step.key}
                      icon={step.icon}
                      label={step.text}
                      status={isLive && isLastStep ? "active" : "complete"}
                    />
                  );
                }
                return (
                  <ChainOfThoughtStep
                    key={step.key}
                    icon={step.icon}
                    label={step.label}
                    status={step.status === "error" ? "complete" : step.status}
                    className={step.status === "error" ? "text-destructive" : undefined}
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
            if (isToolUIPart(part) && isKbViewPart(part)) {
              return (
                <KnowledgeBaseCard
                  key={key}
                  part={part as KbViewToolPart}
                  onConfirmDocuments={isLast && !isStreaming ? onConfirmDocuments : undefined}
                />
              );
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
