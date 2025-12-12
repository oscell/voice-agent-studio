"use client";

import { useEffect } from "react";
import { useInfiniteHits } from "react-instantsearch";
import type { Article } from "@/lib/types/Product";
import { ArticleCard } from "@/app/components/agent/tools/DisplayItemsTool";



export function Hits() {
  const { items } = useInfiniteHits<Article>({});

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
