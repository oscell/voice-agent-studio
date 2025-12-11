"use client";

import { useRef, useState, useMemo } from "react";
import {
  SummaryWithSourcesTool,
  SummaryWithSourcesToolUIPart,
} from "./tools/SummaryWithSourcesTool";
import { UIMessage } from "@ai-sdk/react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

// Show only the user's typed input, not any appended context sent to the agent.
const extractUserInput = (text: string) => {
  if (!text) return text;
  const firstLine = text.split("\n")[0].trim();
  const searchPrefix = "search query:";

  if (firstLine.toLowerCase().startsWith(searchPrefix)) {
    const match = firstLine.match(/Search query:\s*"?([^"]+)"?/i);
    if (match?.[1]) return match[1];
    return firstLine.slice(searchPrefix.length).trim();
  }

  return firstLine;
};

const isSummaryWithSourcesPart = (part: UIMessage["parts"][number]) =>
  part.type === "tool-summary-with-sources";

const hasDisplayableContent = (message: UIMessage) => {
  return message.parts.some(
    (part) =>
      (part.type === "text" && part.text.trim().length > 0) ||
      part.type === "tool-display-items" ||
      isSummaryWithSourcesPart(part)
  );
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
        <div
          className={`pr-6 flex items-start gap-2 ${isOpen ? "max-w-[100%]" : "max-w-full"}`}
        >
          <span
            className={`mt-1 transition-colors ${isOpen ? "text-muted-foreground group-hover:text-foreground" : "text-green-500"}`}
          >
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
                {truncateText(extractUserInput(part.text), isOpen ? 20 : 30)}
              </span>
            ) : null
          )}
        </div>
      </article>
    </button>
  </CollapsibleTrigger>
);

const AgentMessage = ({ message }: { message: UIMessage }) => {
  const textParts = message.parts.filter((part) => part.type === "text");
  const summaryWithSourcesParts = message.parts.filter(
    isSummaryWithSourcesPart
  ) as SummaryWithSourcesToolUIPart[];

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

      {summaryWithSourcesParts.length > 0 && (
        <div className="w-full pl-6">
          {summaryWithSourcesParts.map((part, index) => (
            <SummaryWithSourcesTool
              key={part.toolCallId ?? `${message.id}-summary-${index}`}
              part={part}
            />
          ))}
        </div>
      )}
    </article>
  );
};

const ConversationTurnItem = ({
  turn,
  defaultOpen = false,
}: {
  turn: ConversationTurn;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <UserMessageTrigger message={turn.userMessage} isOpen={isOpen} />
      <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col gap-4 mt-4">
          {turn.agentMessages.map((agentMsg) => (
            <AgentMessage key={agentMsg.id} message={agentMsg} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const AgentWidget = ({
  messages,
  status,
}: {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
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

  const lastTurnIndex = conversationTurns.length - 1;
  const hasHistory = conversationTurns.length > 1;

  const showLoading =
    status === "submitted" ||
    (status === "streaming" &&
      (!conversationTurns[lastTurnIndex]?.agentMessages.length ||
        !hasDisplayableContent(
          conversationTurns[lastTurnIndex].agentMessages[
            conversationTurns[lastTurnIndex].agentMessages.length - 1
          ]
        )));

  return (
    <section className="flex flex-col gap-4">
      {/* History toggle button */}
      {hasHistory && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-muted/50 self-start"
        >
          <History className="h-3 w-3" />
          {showHistory
            ? "Hide history"
            : `Show history (${conversationTurns.length - 1})`}
        </button>
      )}

      {/* Previous conversation turns (collapsed by default) */}
      {showHistory &&
        conversationTurns
          .slice(0, -1)
          .map((turn) => (
            <ConversationTurnItem
              key={turn.userMessage.id}
              turn={turn}
              defaultOpen={false}
            />
          ))}

      {/* Current/latest conversation turn (always visible, not collapsible) */}
      {conversationTurns.length > 0 && (
        <div className="flex flex-col gap-4">
          {conversationTurns[lastTurnIndex].agentMessages.map((agentMsg) => (
            <AgentMessage key={agentMsg.id} message={agentMsg} />
          ))}
          {showLoading && (
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse pl-6">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
            </div>
          )}
        </div>
      )}
      <div ref={bottomRef} />
    </section>
  );
};
