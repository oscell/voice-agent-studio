"use client";

import { useEffect } from "react";
import { useInfiniteHits } from "react-instantsearch";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/types/Product";
import { Button } from "@/components/ui/button";
import { ShoppingBasket } from "lucide-react";
import { ArticleCard } from "../agent/tools/DisplayItemsTool";

type HitsProps = {
  onTopHitsChange?: (hits: Article[]) => void;
  limit?: number;
};
function Hit({ hit }: { hit: Article }) {
  const router = useRouter();

  return (
    <div
      className={`group relative w-full rounded-lg overflow-hidden bg-background border border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}
      onClick={() => {
        router.push(`/product/${hit.objectID}`);
      }}
    >
      {/* Background Image Container */}
      <div
        className="relative w-full aspect-square bg-muted bg-cover bg-center transition-all duration-500 ease-in-out"
        style={{
          backgroundImage: `url(${hit.url})`,
        }}
      >
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick Actions Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="flex gap-2 justify-end">
            <Button
              className="bg-background/90 backdrop-blur-sm hover:bg-background text-foreground rounded-md text-xs px-3 py-1.5 h-auto"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <ShoppingBasket className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        {/* Brand */}
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {hit.author}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-accent transition-colors">
          {hit.title}
        </h3>

        {/* Product Attributes */}
        <div className="flex flex-wrap gap-1.5">{hit.article}</div>

        {/* Description */}
        <div className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-accent transition-colors">
          {hit.article}
        </div>
      </div>
    </div>
  );
}

export function Hits({ onTopHitsChange, limit = 10 }: HitsProps) {
  const { items } = useInfiniteHits<Article>({});

  useEffect(() => {
    if (!onTopHitsChange) return;
    onTopHitsChange(items.slice(0, limit));
  }, [items, limit, onTopHitsChange]);

  return (
    <>
      <div className="grid grid-cols-2 w-full gap-4">
        {items.map((hit) => (
          <ArticleCard key={hit.objectID} article={hit} />
        ))}
      </div>
    </>
  );
}
