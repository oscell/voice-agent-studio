'use client';

import { DisplayItemsTool, DisplayItemsToolUIPart } from "./tools/DisplayItemsTool";
import { UIMessage } from "@ai-sdk/react";

type MessageProps = {
  message: UIMessage;
};

type AgentMessageProps = MessageProps & {
  sendMessage: (args: { text: string }) => void;
};

const truncateText = (text: string, maxLength = 100) => {
  if (!text) return text;
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
};

const UserMessage = ({ message }: MessageProps) => (
  <article className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
    <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-500 rounded-full" />
    <div className="absolute inset-0 bg-gradient-to-l from-green-500/10 to-transparent pointer-events-none -z-10" />
    <div className="max-w-[85%] pr-6 py-2">
      {message.parts.map((part, index) =>
        part.type === "text" ? (
          <h2
            key={`${message.id}-text-${index}`}
            className="text-2xl md:text-3xl font-medium tracking-tight text-right leading-tight text-foreground/90"
          >
            {truncateText(part.text)}
          </h2>
        ) : null,
      )}
    </div>
  </article>
);

const AgentMessage = ({ message, sendMessage }: AgentMessageProps) => {
  const textParts = message.parts.filter((part) => part.type === "text");
  const toolParts = message.parts.filter(
    (part) => part.type === "tool-display-items",
  ) as DisplayItemsToolUIPart[];

  return (
    <article className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none -z-10" />
      
      {textParts.length > 0 && (
        <div className="space-y-4 max-w-[90%] pl-6 py-2">
          {textParts.map((part, index) => (
            <p key={`${message.id}-text-${index}`} className="text-lg md:text-xl leading-relaxed text-muted-foreground">
              {part.type === "text" ? part.text : null}
            </p>
          ))}
        </div>
      )}
      
      {toolParts.length > 0 && (
        <div className="w-full pl-6">
          {toolParts.map((part, index) => (
            <DisplayItemsTool
              key={`${message.id}-tool-${index}`}
              part={part}
              sendMessage={sendMessage}
            />
          ))}
        </div>
      )}
    </article>
  );
};

export const AgentWidget = ({
  messages,
  sendMessage,
}: {
  messages: UIMessage[];
  sendMessage: (args: { text: string }) => void;
}) => {
  // get the last user message index to show only the recent message and the ones after it
  const lastUserIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return i;
      }
    }
    return -1;
  })();
  
  const visibleMessages = lastUserIndex === -1 ? messages : messages.slice(lastUserIndex);

  if (visibleMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 animate-in fade-in duration-500">
        <p className="text-lg">Start a conversation by typing or using the microphone</p>
      </div>
    );
  }

  return (
    <section className="flex flex-col">
      {visibleMessages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AgentMessage key={message.id} message={message} sendMessage={sendMessage} />
        ),
      )}
    </section>
  );
};