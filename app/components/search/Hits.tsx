"use client";

import { useEffect } from "react";
import { useInfiniteHits } from "react-instantsearch";
import type { Article } from "@/lib/types/Product";
import { ArticleCard } from "@/app/components/agent/tools/DisplayItemsTool";

type HitsProps = {
  onTopHitsChange?: (hits: Article[]) => void;
  limit?: number;
};

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
