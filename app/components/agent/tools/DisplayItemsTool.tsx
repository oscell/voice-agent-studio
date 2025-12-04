import type { UIMessage } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
// exhancge icon
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getObjectsByIds } from "../../search/getObjectByIDs";
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

export function DisplayItemsTool({
  part,
  className,
}: {
  message?: UIMessage;
  part?: DisplayItemsToolUIPart;
  className?: string;
  sendMessage: (args: { text: string }) => void;
}) {

  console.log(part);

  if (part?.state !== "output-available") {
    return null;
  }

  const products = part?.output?.response || [];
 
  return (
    <div className={cn("w-full space-y-4", className)}>
      {part?.input?.title && (
        <h3 className="text-lg font-semibold">{part.input.title}</h3>
      )}
      {part?.input?.explanation && (
        <p className="text-sm text-muted-foreground">{part.input.explanation}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
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
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.desc}</CardDescription>
            </CardHeader>
            <CardContent>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
