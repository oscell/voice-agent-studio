'use client';

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Article } from "@/lib/types/Product";
import { ArticleCard } from "@/app/components/agent/tools/DisplayItemsTool";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type SummaryWithSourcesInput = {
  items: Array<{
    text: string;
    objectIds: string[];
  }>;
};

export type SummaryWithSourcesToolUIPart = {
  type: "tool-summary-with-sources";
  toolName: "summary-with-sources";
  toolCallId: string;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: SummaryWithSourcesInput & {
    inputText?: string;
    inputTextDelta?: string;
  };
  inputText?: string;
  inputTextDelta?: string;
  output?: {
    response: Article[];
  };
  errorText?: string;
};

const ReferenceBadge = ({
  article,
  refIndex,
}: {
  article?: Article;
  refIndex: number;
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const padding = 12;
    const desiredWidth = 320;
    const maxWidth = Math.min(desiredWidth, window.innerWidth - padding * 2);
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - maxWidth / 2, padding),
      window.innerWidth - maxWidth - padding
    );
    const top = rect.bottom + 8;
    setPosition({ left, top });
  }, [open]);

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="relative inline align-middle ml-1"
      >
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20 align-middle">
          {refIndex + 1}
        </span>
      </span>
      {open && position
        ? createPortal(
            <div
              className="fixed z-[60] max-w-[calc(100vw-24px)]"
              style={{ left: position.left, top: position.top, width: 320 }}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
            >
              <div className="w-full rounded-xl border border-border/70 bg-background shadow-xl shadow-primary/10">
                {article ? (
                  <ArticleCard article={article} />
                ) : (
                  <p className="p-3 text-xs text-muted-foreground">
                    No article found for reference {refIndex + 1}
                  </p>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export function SummaryWithSourcesTool({
  part,
  className,
}: {
  part?: SummaryWithSourcesToolUIPart;
  className?: string;
}) {
  const [inputBuffer, setInputBuffer] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const inputTextFull =
    part?.input?.inputText ?? part?.inputText ?? "";
  const inputTextDelta =
    part?.input?.inputTextDelta ?? part?.inputTextDelta ?? "";

  useEffect(() => {
    // Reset the buffer when we get a new tool call or a full text update
    setInputBuffer(inputTextFull || "");
  }, [part?.toolCallId, inputTextFull]);

  useEffect(() => {
    if (inputTextFull) {
      return;
    }

    if (inputTextDelta) {
      setInputBuffer((prev) => prev + inputTextDelta);
    }
  }, [inputTextFull, inputTextDelta]);

  if (!part) {
    return null;
  }

  const items = part.input?.items || [];
  const articles = part.output?.response || [];

  // Map objectIds to articles for faster lookup, ignoring any null objectIDs
  const articlesMap = new Map<string, Article>();
  articles.forEach((article) => {
    if (article?.objectID) {
      articlesMap.set(article.objectID, article);
    }
  });

  const isStreaming =
    part.state === "input-streaming" || part.state === "input-available";
  const isOutputAvailable = part.state === "output-available";
  const hasStructuredItems = items.length > 0;
  const hasAnyText = hasStructuredItems || inputBuffer.length > 0;

  return hasAnyText ? (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-full space-y-4", className)}
    >
      <div className="relative">
        <div
          className={cn(
            "transition-[max-height] duration-300 ease-in-out",
            isOpen ? "max-h-[999px]" : "max-h-48 overflow-hidden"
          )}
        >
          {hasStructuredItems ? (
            <p className="text-lg text-muted-foreground leading-relaxed space-y-2">
              {(() => {
                let globalRefCounter = 0;
                return items.map((item, itemIndex) => {
                  const itemText = item.text?.length ? item.text : inputBuffer;
                  return (
                    <span key={itemIndex}>
                      {itemIndex > 0 && " "}
                      {itemText ?? ""}
                      {item.objectIds?.map((id) => {
                        const refIndex = globalRefCounter++;
                        const article = id ? articlesMap.get(id) : undefined;
                        return (
                          <ReferenceBadge
                            key={id}
                            article={article}
                            refIndex={refIndex}
                          />
                        );
                      })}
                    </span>
                  );
                });
              })()}
            </p>
          ) : (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {inputBuffer || "Preparing summary…"}
            </p>
          )}

          {part.state === "output-error" && part.errorText && (
            <p className="text-sm text-red-500">{part.errorText}</p>
          )}

          {isStreaming && !isOutputAvailable && (
            <p className="text-xs text-muted-foreground">Streaming summary…</p>
          )}
        </div>

        {!isOpen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>

      <CollapsibleContent />

      <div className="flex justify-end">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="inline-flex items-center gap-2 text-xs"
          >
            {isOpen ? "Hide summary" : "Show full summary"}
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle summary visibility</span>
          </Button>
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  ) : null;
}
