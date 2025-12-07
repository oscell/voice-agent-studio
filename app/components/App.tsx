"use client";
import { SearchBox } from "./search/SearchBox";
import { AgentWidget } from "./agent/agent";
import { useAgent } from "./agent/use-agent";
import Visualizer from "./Visualizer";
import { useSearchbox } from "../hooks/useSearchbox";

const App: () => JSX.Element = () => {
  const { messages, sendMessage } = useAgent();
  const { listening, ...searchboxProps } = useSearchbox({ sendMessage });

  return (
    <div className="relative flex h-full antialiased overflow-hidden bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      {listening && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Visualizer />
        </div>
      )}
      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        <div className="flex flex-col flex-auto h-full max-w-3xl mx-auto w-full p-4 md:p-6 lg:p-8 gap-6 md:gap-8">
          <SearchBox sendMessage={sendMessage} {...searchboxProps} />
          <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-hide">
            <AgentWidget messages={messages} sendMessage={sendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
