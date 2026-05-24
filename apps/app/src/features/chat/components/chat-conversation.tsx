import type { UIMessage } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@mirrorverse/ui/ai-elements/conversation";

import { MessageRow } from "./message-row";
import { ThinkingRow } from "./thinking-row";

interface ChatConversationProps {
  messages: UIMessage[];
  isStreaming: boolean;
  showThinking: boolean;
  onEditUserMessage: (messageId: string, newText: string) => void;
  onRetryAssistant: () => void;
  onWorkflowSelect?: (workflowId: string) => void;
  onPhoneSelect?: (phoneNumber: string) => void;
  onPhoneNumberForVoiceAgent?: (phoneNumberId: string) => void;
  onGetManagedNumber?: () => void;
  onByoTwilio?: () => void;
  onConfirmDocuments?: (documentIds: string[], labels: string[]) => void;
}

export function ChatConversation({
  messages,
  isStreaming,
  showThinking,
  onEditUserMessage,
  onRetryAssistant,
  onWorkflowSelect,
  onPhoneSelect,
  onPhoneNumberForVoiceAgent,
  onGetManagedNumber,
  onByoTwilio,
  onConfirmDocuments,
}: ChatConversationProps) {
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <Conversation className="flex-1">
      <ConversationContent className="px-0 py-4 w-full">
        <div className="gap-8 px-4 mx-auto flex w-full max-w-[780px] flex-col">
          {messages.map((message, index) => (
            <MessageRow
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
              isStreaming={isStreaming}
              canRetry={index === lastAssistantIndex && !isStreaming}
              onEdit={(text) => onEditUserMessage(message.id, text)}
              onRetry={onRetryAssistant}
              onWorkflowSelect={onWorkflowSelect}
              onPhoneSelect={onPhoneSelect}
              onPhoneNumberForVoiceAgent={onPhoneNumberForVoiceAgent}
              onGetManagedNumber={onGetManagedNumber}
              onByoTwilio={onByoTwilio}
              onConfirmDocuments={onConfirmDocuments}
            />
          ))}
          {showThinking ? <ThinkingRow /> : null}
        </div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
