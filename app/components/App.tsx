"use client";
import { SearchBox } from "./search/SearchBox";
import { AgentWidget } from "./agent/agent";
import { useAgent } from "./agent/use-agent";

const App: () => JSX.Element = () => {
  const { messages, sendMessage } = useAgent();

  return (
    <div className="flex h-full antialiased">
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        <div className="flex flex-col flex-auto h-full">
          <SearchBox
            sendMessage={sendMessage}
          />
          <AgentWidget messages={messages} sendMessage={sendMessage} />
          <div className="relative w-full h-full">
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
