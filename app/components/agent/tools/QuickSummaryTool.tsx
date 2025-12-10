'use client';

import { useEffect, useState } from "react";
import { Article } from "@/lib/types/Product";
import { ArticleCard } from "./DisplayItemsTool";
import { cn } from "@/lib/utils";

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

export function SummaryWithSourcesTool({
  part,
  className,
}: {
  part?: SummaryWithSourcesToolUIPart;
  className?: string;
}) {
  const [inputBuffer, setInputBuffer] = useState("");

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

  // Map objectIds to articles for faster lookup
  const articlesMap = new Map<string, Article>();
  articles.forEach((article) => {
    if (article.objectID) {
      articlesMap.set(article.objectID, article);
    }
  });

  const isStreaming =
    part.state === "input-streaming" || part.state === "input-available";
  const isOutputAvailable = part.state === "output-available";
  const hasStructuredItems = items.length > 0;
  const hasAnyText = hasStructuredItems || inputBuffer.length > 0;

  return hasAnyText ? (
    <div className={cn("w-full space-y-6", className)}>
      {hasStructuredItems ? (
        items.map((item, index) => (
          <div key={index} className="space-y-2">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {(item.text?.length ? item.text : inputBuffer) ?? ""}
              {item.objectIds?.map((id, refIndex) => {
                const article = articlesMap.get(id);
                return (
                  <span
                    key={id}
                    className="relative group inline-flex items-center align-baseline ml-1"
                  >
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
                      {refIndex + 1}
                    </span>
                    <div className="absolute left-1/2 top-full z-30 mt-2 hidden -translate-x-1/2 whitespace-normal group-hover:block">
                      <div className="w-72 rounded-xl border border-border/70 bg-background shadow-xl shadow-primary/10">
                        {article ? (
                          <ArticleCard article={article} />
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground">
                            {isOutputAvailable
                              ? "Source details unavailable."
                              : "Fetching source…"}
                          </div>
                        )}
                      </div>
                    </div>
                  </span>
                );
              })}
            </p>
          </div>
        ))
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
  ) : null;
}
