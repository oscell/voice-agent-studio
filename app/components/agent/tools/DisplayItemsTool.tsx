import type { UIMessage } from "@ai-sdk/react";
import Image from "next/image";
import { useState } from "react";
import {
  ExternalLink,
  Newspaper,
  User,
  Calendar,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Article, Product } from "@/lib/types/Product";

export type DisplayItemsToolUIPart = {
  type: "tool-display-items";
  toolName: "display-items";
  toolCallId: string;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input: DisplayItemsInput;
  output?: DisplayItemsOutput;
  errorText?: string;
};

export type DisplayItemsInput = {
  objectIDs: string[];
  explanation: string;
  title: string;
};

export type DisplayItemsOutput = {
  response: Product[] | Article[];
};

const truncate = (text: string, maxLength = 20) => {
  if (!text) return text;
  return text.length > maxLength
    ? `${text.slice(0, maxLength).trimEnd()}…`
    : text;
};

function ProductCard({ product }: { product: Product }) {
  return (
    <Card key={product.objectID} className="overflow-hidden">
      {product.image && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={`https://fxqklbpngldowtbkqezm.supabase.co/storage/v1/object/public/product-images/${product.image}`}
            alt={product.objectID}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-sm">{truncate(product.name)}</CardTitle>
        <CardDescription>{truncate(product.desc)}</CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  const formatDate = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card
      key={article.objectID}
      className="overflow-hidden flex flex-col h-full p-0"
    >
      <CardHeader className="space-y-1.5 p-3 pb-2">
        <div className="flex items-start gap-1.5 group/title cursor-pointer">
          <Newspaper className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 group-hover/title:text-primary transition-colors" />
          <CardTitle className="text-sm leading-tight line-clamp-2">
            <span className="bg-gradient-to-r from-primary to-primary bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-all duration-300 group-hover/title:bg-[length:100%_1px]">
              {article.title}
            </span>
          </CardTitle>
        </div>
        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pl-5">
          <div className="flex items-center gap-1">
            <User className="h-2.5 w-2.5" />
            <span className="font-medium truncate max-w-[140px]">
              {article.author}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {article.publication && (
              <div className="flex items-center gap-1">
                <Building2 className="h-2.5 w-2.5" />
                <span className="truncate max-w-[100px] italic">
                  {article.publication}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              <span className="whitespace-nowrap tabular-nums">
                {formatDate(article.year, article.month, article.day)}
              </span>
            </div>
          </div>
        </div>
        <CardDescription className="text-xs line-clamp-2 leading-relaxed pl-5">
          {article.article}
        </CardDescription>
      </CardHeader>
      {article.url && (
        <CardContent className="pt-0 mt-auto px-3 pb-3 pl-5">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link text-[10px] text-primary inline-flex items-center gap-1 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Read more
            <ExternalLink className="h-2.5 w-2.5 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </a>
        </CardContent>
      )}
    </Card>
  );
}

export function DisplayItemsTool({
  part,
  className,
}: {
  message?: UIMessage;
  part?: DisplayItemsToolUIPart;
  className?: string;
  sendMessage: (args: { text: string }) => void;
}) {
  const [showAllMobile, setShowAllMobile] = useState(false);

  if (part?.state !== "output-available") {
    return null;
  }

  const items = part?.output?.response || [];

  console.log("items", items);
  const hasExtraItems = items.length > 1;
  const itemsToDisplay = showAllMobile ? items : items.slice(0, 2);

  // Check if items are Articles by checking for 'article' property
  const isArticle = (item: Product | Article): item is Article => {
    return "article" in item && "author" in item;
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {part?.input?.title && (
        <h3 className="text-lg font-semibold">{part.input.title}</h3>
      )}
      {part?.input?.explanation && (
        <p className="text-sm text-muted-foreground">
          {part.input.explanation}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {itemsToDisplay.map((item) => {
          if (isArticle(item)) {
            return <ArticleCard key={item.objectID} article={item} />;
          } else {
            return <ProductCard key={item.objectID} product={item} />;
          }
        })}
      </div>
      {hasExtraItems && (
        <div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAllMobile((prev) => !prev)}
          >
            {showAllMobile ? "Show fewer items" : "Show all items"}
          </Button>
        </div>
      )}
    </div>
  );
}
