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
    <div className="relative flex h-full antialiased overflow-hidden">
      {listening && <Visualizer />}
      <div className="flex flex-row h-full w-full overflow-x-hidden relative">
        <div className="flex flex-col flex-auto h-full gap-6">
          <SearchBox sendMessage={sendMessage} {...searchboxProps} />
          <AgentWidget messages={messages} sendMessage={sendMessage} />
          <div className="relative w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default App;
