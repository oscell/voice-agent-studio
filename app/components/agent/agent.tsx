"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  DisplayItemsTool,
  DisplayItemsToolUIPart,
} from "./tools/DisplayItemsTool";
import { UIMessage } from "@ai-sdk/react";
import { MicrophoneIcon } from "../icons/MicrophoneIcon";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import config from "@/lib/constants";

type MessageProps = {
  message: UIMessage;
};

type AgentMessageProps = MessageProps & {
  sendMessage: (args: { text: string }) => void;
};

type ConversationTurn = {
  userMessage: UIMessage;
  agentMessages: UIMessage[];
};

const truncateText = (text: string, maxLength = 100) => {
  if (!text) return text;
  return text.length > maxLength
    ? `${text.slice(0, maxLength).trimEnd()}…`
    : text;
};

const getUserMessageText = (message: UIMessage): string => {
  const textPart = message.parts.find((part) => part.type === "text");
  return textPart?.type === "text" ? textPart.text : "";
};

const UserMessageTrigger = ({
  message,
  isOpen,
}: {
  message: UIMessage;
  isOpen: boolean;
}) => (
  <CollapsibleTrigger asChild>
    <button className="w-full flex justify-end cursor-pointer group">
      <article className="flex justify-end relative w-full">
        {isOpen && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-500 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-l from-green-500/10 to-transparent pointer-events-none -z-10 group-hover:from-green-500/20 transition-colors" />
          </>
        )}
        <div className={`pr-6 flex items-start gap-2 ${isOpen ? "max-w-[100%]" : "max-w-full"}`}>
          <span className={`mt-1 transition-colors ${isOpen ? "text-muted-foreground group-hover:text-foreground" : "text-green-500"}`}>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </span>
          {message.parts.map((part, index) =>
            part.type === "text" ? (
              <span
                key={`${message.id}-text-${index}`}
                className={`font-medium tracking-tight text-right leading-tight transition-all ${
                  isOpen
                    ? "text-2xl md:text-3xl text-foreground/90"
                    : "text-sm text-green-500 group-hover:text-green-400"
                }`}
              >
                {truncateText(part.text, isOpen ? 20 : 30)}
              </span>
            ) : null
          )}
        </div>
      </article>
    </button>
  </CollapsibleTrigger>
);

const AgentMessage = ({ message, sendMessage }: AgentMessageProps) => {
  const textParts = message.parts.filter((part) => part.type === "text");
  const toolParts = message.parts.filter(
    (part) => part.type === "tool-display-items"
  ) as DisplayItemsToolUIPart[];

  return (
    <article className="flex flex-col gap-6 relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none -z-10" />

      {textParts.length > 0 && (
        <div className="space-y-4 max-w-[90%] pl-6 py-2">
          {textParts.map((part, index) => (
            <p
              key={`${message.id}-text-${index}`}
              className="text-lg md:text-xl leading-relaxed text-muted-foreground"
            >
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

const ConversationTurnItem = ({
  turn,
  sendMessage,
  defaultOpen = false,
}: {
  turn: ConversationTurn;
  sendMessage: (args: { text: string }) => void;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <UserMessageTrigger message={turn.userMessage} isOpen={isOpen} />
      <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col gap-4 mt-4">
          {turn.agentMessages.map((agentMsg) => (
            <AgentMessage
              key={agentMsg.id}
              message={agentMsg}
              sendMessage={sendMessage}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const AgentWidget = ({
  messages,
  sendMessage,
  handleMicToggle,
  micDisabled,
  micPressed,
}: {
  messages: UIMessage[];
  sendMessage: (args: { text: string }) => void;
  handleMicToggle: () => void;
  micDisabled: boolean;
  micPressed: boolean;
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Group messages into conversation turns (user message + following agent messages)
  const conversationTurns = useMemo(() => {
    const turns: ConversationTurn[] = [];
    let currentTurn: ConversationTurn | null = null;

    for (const message of messages) {
      if (message.role === "user") {
        if (currentTurn) {
          turns.push(currentTurn);
        }
        currentTurn = { userMessage: message, agentMessages: [] };
      } else if (currentTurn) {
        currentTurn.agentMessages.push(message);
      }
    }

    if (currentTurn) {
      turns.push(currentTurn);
    }

    return turns;
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 animate-in fade-in duration-500">
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={micDisabled}
          aria-pressed={micPressed}
          className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 mb-4 ${
            micPressed
              ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 shadow-lg scale-105"
              : "bg-secondary hover:bg-primary/10 hover:text-primary"
          }`}
        >
          <MicrophoneIcon micOpen={micPressed} className="h-10 w-10" />
        </button>
        <p className="text-lg mb-6">Press the microphone to start a conversation</p>
        
        {config.verticals.articles.quickPrompts.length > 0 && (
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <p className="text-xs text-muted-foreground/70 mb-1">Or try one of these:</p>
            {config.verticals.articles.quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => sendMessage({ text: prompt.message })}
                className="px-4 py-2 text-sm rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const lastTurnIndex = conversationTurns.length - 1;
  const hasHistory = conversationTurns.length > 1;

  return (
    <section className="flex flex-col gap-4">
      {/* History toggle button */}
      {hasHistory && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-muted/50 self-start"
        >
          <History className="h-3 w-3" />
          {showHistory ? "Hide history" : `Show history (${conversationTurns.length - 1})`}
        </button>
      )}

      {/* Previous conversation turns (collapsed by default) */}
      {showHistory &&
        conversationTurns.slice(0, -1).map((turn) => (
          <ConversationTurnItem
            key={turn.userMessage.id}
            turn={turn}
            sendMessage={sendMessage}
            defaultOpen={false}
          />
        ))}

      {/* Current/latest conversation turn (always visible, not collapsible) */}
      {conversationTurns.length > 0 && (
        <div className="flex flex-col gap-4">
          <article className="flex justify-end relative">
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-500 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-l from-green-500/10 to-transparent pointer-events-none -z-10" />
            <div className="max-w-[85%] pr-6 py-2">
              {conversationTurns[lastTurnIndex].userMessage.parts.map((part, index) =>
                part.type === "text" ? (
                  <h2
                    key={`${conversationTurns[lastTurnIndex].userMessage.id}-text-${index}`}
                    className="text-2xl md:text-3xl font-medium tracking-tight text-right leading-tight text-foreground/90"
                  >
                    {truncateText(part.text, 100)}
                  </h2>
                ) : null
              )}
            </div>
          </article>
          {conversationTurns[lastTurnIndex].agentMessages.map((agentMsg) => (
            <AgentMessage
              key={agentMsg.id}
              message={agentMsg}
              sendMessage={sendMessage}
            />
          ))}
        </div>
      )}
      <div ref={bottomRef} />
    </section>
  );
};
