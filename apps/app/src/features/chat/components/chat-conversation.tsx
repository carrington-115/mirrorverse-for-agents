import type { UIMessage } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@mirrorverse/ui/ai-elements/conversation";

import { AppConnectPanel } from "./app-connect-panel";
import { MessageRow } from "./message-row";
import { ThinkingRow } from "./thinking-row";

interface CredentialsInterrupt {
  kind: string;
  id: string;
  appSlugs: string[];
}

interface ChatConversationProps {
  messages: UIMessage[];
  isStreaming: boolean;
  showThinking: boolean;
  interrupt?: CredentialsInterrupt | null;
  chatId?: string;
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
  interrupt,
  chatId,
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
          {messages
            .filter((m, i) => {
              if (!showThinking) return true;
              if (i !== messages.length - 1) return true;
              return !(m.role === "assistant" && m.parts.length === 0);
            })
            .map((message, index, arr) => (
              <MessageRow
                key={message.id}
                message={message}
                isLast={index === arr.length - 1}
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
          {interrupt && !isStreaming && chatId && (
            <AppConnectPanel appSlugs={interrupt.appSlugs} chatId={chatId} />
          )}
        </div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
