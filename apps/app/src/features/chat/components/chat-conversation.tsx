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
}

export function ChatConversation({ messages, isStreaming, showThinking }: ChatConversationProps) {
  return (
    <Conversation className="flex-1">
      <ConversationContent className="px-4 mx-auto w-full max-w-[780px]">
        {messages.map((message, index) => (
          <MessageRow
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
            isStreaming={isStreaming}
          />
        ))}
        {showThinking ? <ThinkingRow /> : null}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
