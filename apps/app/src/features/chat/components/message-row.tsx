import { isReasoningUIPart, isTextUIPart, isToolUIPart, type UIMessage } from "ai";

import { Message, MessageContent, MessageResponse } from "@mirrorverse/ui/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@mirrorverse/ui/ai-elements/reasoning";

import { AssistantAvatar } from "./assistant-avatar";
import { WorkflowCommitCard } from "./workflow-commit-card";
import { isWorkflowCommitPart } from "@/features/chat/lib/workflow-commit-tool";

interface MessageRowProps {
  message: UIMessage;
  isLast: boolean;
  isStreaming: boolean;
}

export function MessageRow({ message, isLast, isStreaming }: MessageRowProps) {
  const reasoningText = message.parts
    .filter(isReasoningUIPart)
    .map((p) => p.text)
    .join("\n\n");
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLast && isStreaming && lastPart ? isReasoningUIPart(lastPart) : false;

  const body = (
    <Message from={message.role}>
      <MessageContent>
        {reasoningText.length > 0 ? (
          <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoningText}</ReasoningContent>
          </Reasoning>
        ) : null}
        {message.parts.map((part, i) => {
          const key = `${message.id}-${i}`;
          if (isTextUIPart(part)) return <MessageResponse key={key}>{part.text}</MessageResponse>;
          if (isToolUIPart(part) && isWorkflowCommitPart(part)) {
            return <WorkflowCommitCard key={key} part={part} />;
          }
          return null;
        })}
      </MessageContent>
    </Message>
  );

  if (message.role === "user") return body;

  return (
    <div className="my-6 gap-3 flex w-full">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">{body}</div>
    </div>
  );
}
