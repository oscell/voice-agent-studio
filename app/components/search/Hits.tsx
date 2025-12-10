"use client";

import { useInfiniteHits } from "react-instantsearch";
import { useRouter } from "next/navigation";
import { useSearchBox } from "react-instantsearch";
import type { Product } from "@/lib/types/Product";
import { Button } from "@/components/ui/button";
import { ShoppingBasket } from "lucide-react";
import { useEffect, useRef } from "react";

function Hit({ hit }: { hit: Product }) {
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
          backgroundImage: `url(${hit.image})`,
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
          {hit.name}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-accent transition-colors">
          {hit.name}
        </h3>

        {/* Product Attributes */}
        <div className="flex flex-wrap gap-1.5">{hit.desc}</div>

        {/* Description */}
        <div className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-accent transition-colors">
          {hit.desc}
        </div>
      </div>
    </div>
  );
}

export function Hits() {
  const { items, isLastPage, showMore } = useInfiniteHits<Product>({});
  const { query } = useSearchBox();
  const loadingRef = useRef<HTMLDivElement>(null);
  const shouldShowHomePage = (query?.trim().length ?? 0) === 0;

  useEffect(() => {
    if (shouldShowHomePage) return;
    if (!loadingRef.current || isLastPage) return;
    const target = loadingRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          showMore();
        }
      },
      { root: null, rootMargin: "200px 0px", threshold: 0 }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [isLastPage, showMore, items.length, shouldShowHomePage]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-4">
        {items.map((hit) => (
          <Hit key={hit.objectID} hit={hit} />
        ))}
      </div>

      {!isLastPage && (
        <div
          ref={loadingRef}
          className="h-8 w-full flex items-center justify-center"
        >
          <span className="text-xs text-muted-foreground">Loading more…</span>
        </div>
      )}
    </>
  );
}
