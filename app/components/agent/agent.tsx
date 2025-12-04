
'use client';

import { DisplayItemsTool, DisplayItemsToolUIPart } from './tools/DisplayItemsTool';
import { UIMessage } from '@ai-sdk/react';

  export const AgentWidget = ({ messages, sendMessage }: { messages: UIMessage[], sendMessage: (args: { text: string }) => void }) => {
  return (
    <section className="agent-widget">
      <div className="agent-widget__messages">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`agent-widget__message agent-widget__message--${message.role}`}
          >
            <header className="agent-widget__message-label">
              {message.role === 'user' ? 'You' : 'AI'}
            </header>
            <div className="agent-widget__message-body">
              {message.parts.map((part, index) =>
                part.type === 'text' ? <p key={index}>{part.text}</p> : null,
              )}
              {message.parts.map((part, index) =>
                part.type === 'tool-display-items' ? <DisplayItemsTool key={index} part={part as DisplayItemsToolUIPart} sendMessage={sendMessage} /> : null,
              )}
            </div>
          </article>
        ))}
      </div>

    </section>
  );
};