"use client";
import { SearchBox } from "./search/SearchBox";
import { AgentWidget } from "./agent/agent";
import Visualizer from "./Visualizer";
import { useAgentChat } from "../hooks/useAgentChat";

const App: () => JSX.Element = () => {
  const {
    messages,
    sendMessage,
    status,
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

  return (
    <div className="relative flex w-[400px] h-full antialiased overflow-hidden bg-background text-foreground selection:bg-primary/10 selection:text-primary">
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
          <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-hide">
            <AgentWidget 
              messages={messages} 
              sendMessage={sendMessage} 
              handleMicToggle={handleMicToggle}
              micDisabled={micDisabled}
              micPressed={micPressed}
              status={status}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
