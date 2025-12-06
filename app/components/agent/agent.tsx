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
  <article className={`agent-widget__message agent-widget__message--${message.role}`}>
    <div className="agent-widget__message-body">
      {message.parts.map((part, index) =>
        part.type === "text" ? (
          <h2
            key={`${message.id}-text-${index}`}
            className="text-xl font-bold leading-relaxed bg-gradient-to-r from-primary via-primary/80 to-accent text-transparent bg-clip-text"
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
    <article className={`agent-widget__message agent-widget__message--${message.role}`}>
      <div className="agent-widget__message-body space-y-4">
        {textParts.map((part, index) => (
          <p key={`${message.id}-text-${index}`} className="text-lg leading-relaxed">
            {part.type === "text" ? part.text : null}
          </p>
        ))}
        {toolParts.map((part, index) => (
          <DisplayItemsTool
            key={`${message.id}-tool-${index}`}
            part={part}
            sendMessage={sendMessage}
          />
        ))}
      </div>
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

  return (
    <section className="agent-widget">
      <div className="agent-widget__messages">
        {visibleMessages.map((message) =>
          message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AgentMessage key={message.id} message={message} sendMessage={sendMessage} />
          ),
        )}
      </div>
    </section>
  );
};