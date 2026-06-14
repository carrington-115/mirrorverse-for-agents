import { useState } from "react";
import { isTextUIPart, isToolUIPart, type ToolUIPart, type UIMessage } from "ai";

import { ChainOfThoughtStep } from "@mirrorverse/ui/ai-elements/chain-of-thought";
import {
  type AnimateOptions,
  Message,
  MessageContent,
  MessageResponse,
} from "@mirrorverse/ui/ai-elements/message";
import {
  Reasoning,
  ReasoningContentRaw,
  ReasoningTrigger,
} from "@mirrorverse/ui/ai-elements/reasoning";
import { Shimmer } from "@mirrorverse/ui/ai-elements/shimmer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { AssistantAvatar } from "./assistant-avatar";
import { MessageActions } from "./message-actions";
import { UnknownToolCard } from "./unknown-tool-card";
import { WorkflowCommitCard } from "./workflow-commit-card";
import { WorkflowPlanCard } from "./workflow-plan-card";
import { PhoneNumberSelectionCard } from "./phone-number-selection-card";
import { PhoneNumberProvisionCard } from "./phone-number-provision-card";
import { UnassignedPhoneNumbersCard } from "./unassigned-phone-numbers-card";
import { VoiceAgentActivateCard } from "./voice-agent-activate-card";
import { KnowledgeBaseCard } from "./knowledge-base-card";
import { ContentBodyCard } from "./content-body-card";
import { ToolErrorBoundary } from "@/features/chat/lib/tool-error-boundary";
import { isWorkflowCommitPart } from "@/features/chat/lib/workflow-commit-tool";
import { isSubmitPlanPart, type SubmitPlanToolPart } from "@/features/chat/lib/submit-plan-tool";
import { buildCotTimeline } from "@/features/chat/lib/cot-timeline";
import { isKbViewPart, type KbViewToolPart } from "@/features/chat/lib/knowledge-tools";
import {
  isContentBodyPart,
  type ContentBodyToolPart,
} from "@/features/chat/lib/content-body-tools";
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
  onConfirmContentBody?: (contentType: string, subject: string | undefined, body: string) => void;
}

const MESSAGE_ANIMATION_OPTIONS: AnimateOptions = { sep: "word", animation: "fadeIn" };

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
  onConfirmContentBody,
}: MessageRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const initialText = extractCopyText(message);
  const [draft, setDraft] = useState(initialText);

  const isLive = isLast && isStreaming;
  const { steps, hasAny } = buildCotTimeline(message);

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
          <div className="not-prose space-y-2 w-full">
            <Reasoning isStreaming={isLive} className="!mb-0">
              <ReasoningTrigger />
              <ReasoningContentRaw>
                <div className="space-y-2">
                  {steps.map((step, i) => {
                    const isActive = isLive && i === steps.length - 1;
                    if (step.kind === "reasoning") {
                      return (
                        <div
                          key={step.key}
                          className="gap-2 flex animate-in items-center fade-in-0 slide-in-from-top-2"
                        >
                          <step.icon className="size-3.5 shrink-0" />
                          {isActive ? (
                            <Shimmer duration={1.5}>Thinking...</Shimmer>
                          ) : (
                            <span className="opacity-50">Thought</span>
                          )}
                        </div>
                      );
                    }
                    return (
                      <ChainOfThoughtStep
                        key={step.key}
                        icon={step.icon}
                        label={
                          isActive ? <Shimmer duration={1.5}>{step.label}</Shimmer> : step.label
                        }
                        status={step.status === "error" ? "complete" : step.status}
                        className={cn(
                          "text-xs",
                          step.status === "error" ? "text-destructive" : undefined,
                        )}
                      />
                    );
                  })}
                </div>
              </ReasoningContentRaw>
            </Reasoning>
          </div>
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
            if (isTextUIPart(part)) {
              const isLivePart = isLive && i === message.parts.length - 1;
              return (
                <MessageResponse
                  key={key}
                  isAnimating={isLivePart}
                  animated={isLivePart ? MESSAGE_ANIMATION_OPTIONS : undefined}
                  className={
                    isLivePart
                      ? "[&>*:last-child]:after:inline [&>*:last-child]:after:animate-caret-blink [&>*:last-child]:after:align-baseline [&>*:last-child]:after:content-['_▋']"
                      : undefined
                  }
                >
                  {part.text}
                </MessageResponse>
              );
            }
            if (!isToolUIPart(part)) return null;
            // DynamicToolUIPart matches isToolUIPart but has type "dynamic-tool"
            // (not tool-${string}), so cast once and let it fall through to UnknownToolCard.
            const toolPart = part as ToolUIPart;
            return (
              <ToolErrorBoundary key={key} toolType={toolPart.type}>
                {isSubmitPlanPart(toolPart) ? (
                  <WorkflowPlanCard part={toolPart as SubmitPlanToolPart} />
                ) : isWorkflowCommitPart(toolPart) ? (
                  <WorkflowCommitCard part={toolPart} onWorkflowSelect={onWorkflowSelect} />
                ) : isPhoneSearchPart(toolPart) ? (
                  <PhoneNumberSelectionCard
                    part={toolPart as PhoneSearchToolPart}
                    onPhoneSelect={isLast && !isStreaming ? onPhoneSelect : undefined}
                  />
                ) : isPhoneProvisionPart(toolPart) || isByoTwilioPart(toolPart) ? (
                  <PhoneNumberProvisionCard
                    part={toolPart as PhoneProvisionToolPart | ByoTwilioToolPart}
                  />
                ) : isUnassignedNumbersPart(toolPart) ? (
                  <UnassignedPhoneNumbersCard
                    part={toolPart as UnassignedNumbersToolPart}
                    onSelect={isLast && !isStreaming ? onPhoneNumberForVoiceAgent : undefined}
                    onGetManagedNumber={isLast && !isStreaming ? onGetManagedNumber : undefined}
                    onByoTwilio={isLast && !isStreaming ? onByoTwilio : undefined}
                  />
                ) : isVoiceActivatePart(toolPart) ? (
                  <VoiceAgentActivateCard part={toolPart as VoiceActivateToolPart} />
                ) : isKbViewPart(toolPart) ? (
                  <KnowledgeBaseCard
                    part={toolPart as KbViewToolPart}
                    onConfirmDocuments={isLast && !isStreaming ? onConfirmDocuments : undefined}
                  />
                ) : isContentBodyPart(toolPart) ? (
                  <ContentBodyCard
                    part={toolPart as ContentBodyToolPart}
                    onConfirm={isLast && !isStreaming ? onConfirmContentBody : undefined}
                  />
                ) : (
                  <UnknownToolCard part={toolPart} />
                )}
              </ToolErrorBoundary>
            );
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
