import type { UIMessage } from "@ai-sdk/react";
import Image from "next/image";
import { useState } from "react";
// exhancge icon
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/types/Product";

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
  response: Product[];
};

const truncate = (text: string, maxLength = 50) => {
  if (!text) return text;
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
};

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

  const products = part?.output?.response || [];
  const hasExtraProducts = products.length > 2;
 
  return (
    <div className={cn("w-full space-y-4", className)}>
      {part?.input?.title && (
        <h3 className="text-lg font-semibold">{part.input.title}</h3>
      )}
      {part?.input?.explanation && (
        <p className="text-sm text-muted-foreground">{part.input.explanation}</p>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <Card
            key={product.objectID}
            className={cn(
              "overflow-hidden",
              hasExtraProducts && !showAllMobile && index >= 2 && "hidden md:block",
            )}
          >
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
            <CardHeader >
              <CardTitle className="text-sm">{truncate(product.name)}</CardTitle>
              <CardDescription>{truncate(product.desc)}</CardDescription>
            </CardHeader>
            <CardContent>

            </CardContent>
          </Card>
        ))}
      </div>
      {hasExtraProducts && (
        <div className="md:hidden">
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
