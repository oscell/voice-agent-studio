"use client";
import { useHits, useInstantSearch } from "react-instantsearch";
import { ArrowUpRight } from "lucide-react";
import { SummaryWithSourcesInput } from "../agent/tools/SummaryWithSourcesTool";

export type Suggestion = {
  objectID: string;
  query: string;
  result_object_ids: string[];
  tool_output: SummaryWithSourcesInput;
};

export function Suggestions({
  setInputValue,
  inputValue,
  handleSubmit,
  refineMainQuery,
}: {
  setInputValue: (value: string) => void;
  inputValue: string;
  handleSubmit: (query: string) => void;
  refineMainQuery: (query: string) => void;
}) {
  const { results } = useHits<Suggestion>();
  const { uiState } = useInstantSearch();

  const handleClick = (query: string) => {
    // Push the chosen suggestion into the root InstantSearch state before submitting.
    console.log("uiState", uiState);
    refineMainQuery(query);
    setInputValue(query);
    handleSubmit(query);
  };

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
              handleClick(hit.query);
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
