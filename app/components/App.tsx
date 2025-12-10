"use client";
import { useEffect, useState } from "react";
import { SearchBox } from "./search/SearchBox";
import { AgentWidget } from "./agent/agent";
import Visualizer from "./Visualizer";
import { useAgentChat } from "../hooks/useAgentChat";
import { Hits } from "./search/Hits";
import { InstantSearch, useSearchBox } from "react-instantsearch";
import { algoliasearch } from "algoliasearch";
import config from "@/lib/constants";
import { MicrophoneIcon } from "./icons/MicrophoneIcon";
import type { Article } from "@/lib/types/Product";

const App: () => JSX.Element = () => {
  return (
    <InstantSearch indexName="news_paper_generic_v2" searchClient={algoliasearch(config.algolia.appId!, config.algolia.apiKey!)}>
      <Page />
    </InstantSearch>
  );
};

export default App;

const Page = () => {
  const { query } = useSearchBox();
  const {
    messages,
    status,
    sendMessage,
    listening,
    handleMicToggle,
    micDisabled,
    micPressed,
    inputValue,
    setInputValue,
    inputRef,
    handleKeyDown,
    handleClear,
    micVariant,
    errorMessage,
    warningMessage,
  } = useAgentChat();

  const [topHits, setTopHits] = useState<Article[]>([]);
  const [lastSentSnapshot, setLastSentSnapshot] = useState("");

  // Allow resending the same query after clearing the input.
  useEffect(() => {
    if (!inputValue.trim() && lastSentSnapshot) {
      setLastSentSnapshot("");
    }
  }, [inputValue, lastSentSnapshot]);

  // Debounce sending search context to the agent until typing stops and the agent is idle.
  useEffect(() => {
    const trimmedQuery = inputValue.trim();
    const topTenHits = topHits.slice(0, 10);

    if (status !== "ready") return;
    if (!trimmedQuery) return;
    if (topTenHits.length === 0) return;

    const snapshot = `${trimmedQuery}::${topTenHits
      .map((hit) => hit.objectID)
      .join(",")}`;
    if (snapshot === lastSentSnapshot) return;

    const timer = setTimeout(() => {
      const formattedHits = topTenHits
        .map(
          (hit, index) =>
            `${index + 1}. ${hit.title} by ${hit.author} (id: ${hit.objectID})`
        )
        .join("\n");

      sendMessage({
        text: `Search query: "${trimmedQuery}"\nTop results:\n${formattedHits}`,
      });
      setLastSentSnapshot(snapshot);
    }, 600);

    return () => clearTimeout(timer);
  }, [inputValue, lastSentSnapshot, sendMessage, status, topHits]);

  console.log(query);
  return (
    <div className="relative flex w-full h-full antialiased overflow-hidden bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      {listening && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Visualizer />
        </div>
      )}
      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        <div className="flex flex-col flex-auto h-full max-w-3xl mx-auto w-full p-4 gap-6">
          <SearchBox
            inputValue={inputValue}
            setInputValue={setInputValue}
            inputRef={inputRef}
            handleKeyDown={handleKeyDown}
            handleClear={handleClear}
            handleMicToggle={handleMicToggle}
            micDisabled={micDisabled}
            micVariant={micVariant}
            micPressed={micPressed}
            errorMessage={errorMessage}
            warningMessage={warningMessage}
            showMic={messages.length > 0}
          />

          {(messages.length === 0 && query === "") && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 animate-in fade-in duration-500">
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={micDisabled}
                aria-pressed={micPressed}
                className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 mb-4 ${
                  micPressed
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 shadow-lg scale-105"
                    : "bg-secondary hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <MicrophoneIcon micOpen={micPressed} className="h-10 w-10" />
              </button>
              <p className="text-lg mb-6">
                Press the microphone to start a conversation
              </p>

              {config.verticals.articles.quickPrompts.length > 0 && (
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <p className="text-xs text-muted-foreground/70 mb-1">
                    Or try one of these:
                  </p>
                  {config.verticals.articles.quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(prompt.message)}
                      className="px-4 py-2 text-sm rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-hide">
            <AgentWidget
              messages={messages}
              status={status}
            />
            <Hits onTopHitsChange={setTopHits} />
          </div>
        </div>
      </div>
    </div>
  );
};