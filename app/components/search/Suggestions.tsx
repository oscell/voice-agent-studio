"use client";
import { useHits } from "react-instantsearch";
import { ArrowUpRight } from "lucide-react";

type Suggestion = {
  objectID: string;
  query: string;
};

export function Suggestions({ setInputValue,inputValue,handleSubmit }: { setInputValue: (value: string) => void,inputValue: string,handleSubmit: (query: string) => void }) {
  const { results } = useHits<Suggestion>();

  if (results?.hits.length === 0 || ( results?.hits.length === 1 && results?.hits[0].query.toLowerCase() === inputValue.toLowerCase())) {
    return null;
  }

  return (
    <>
      <div className="w-full gap-4 flex flex-row overflow-x-auto text-nowrap pb-2 ">
        {results?.hits.map((hit) => (
          <div 
            key={hit.objectID}
            className="group relative inline-flex items-center gap-1.5 cursor-pointer"
            onClick={() => {
              setInputValue(hit.query);
              handleSubmit(hit.query);
            }}
          >
            <span className="relative">
              {hit.query}
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-current transition-all duration-300 group-hover:w-full" />
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>
    </>
  );
}
