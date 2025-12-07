import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  input: SummaryWithSourcesInput;
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
  if (part?.state !== "output-available") {
    return null;
  }

  const items = part.input.items || [];
  const articles = part.output?.response || [];

  // Map objectIds to articles for faster lookup
  const articlesMap = new Map<string, Article>();
  articles.forEach((article) => {
    if (article.objectID) {
      articlesMap.set(article.objectID, article);
    }
  });

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("relative w-full space-y-6", className)}>
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {item.text}{" "}
              {item.objectIds.map((id, refIndex) => {
                const article = articlesMap.get(id);
                if (!article) return null;

                return (
                  <span
                    key={id}
                    className="inline-flex items-center align-baseline ml-1"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-shadow"
                          aria-label={`View source ${refIndex + 1}`}
                        >
                          {refIndex + 1}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="center"
                        sideOffset={10}
                        className="w-72 p-0 rounded-xl border border-border/70 bg-background shadow-xl shadow-primary/10"
                        hideArrow
                      >
                        <ArticleCard article={article} />
                      </TooltipContent>
                    </Tooltip>
                  </span>
                );
              })}
            </p>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
