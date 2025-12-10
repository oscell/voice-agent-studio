"use client";

import { Button } from "@/components/ui/button";
import { MicrophoneIcon } from "../icons/MicrophoneIcon";
import { Textarea } from "@/components/ui/textarea";
import type { UseAgentChatResult } from "../../hooks/useAgentChat";
import { useSearchBox } from "react-instantsearch";

type SearchBoxProps = {
  showMic?: boolean;
} & Pick<
  UseAgentChatResult,
  | "inputValue"
  | "setInputValue"
  | "inputRef"
  | "handleKeyDown"
  | "handleClear"
  | "handleMicToggle"
  | "micDisabled"
  | "micVariant"
  | "micPressed"
  | "errorMessage"
  | "warningMessage"
>;

export const SearchBox = ({
  showMic = true,
  ...searchboxProps
}: SearchBoxProps) => {
  const { refine } = useSearchBox();
  const {
    inputValue,
    setInputValue,
    inputRef,
    handleKeyDown,
    handleClear,
    handleMicToggle,
    micDisabled,
    micVariant,
    micPressed,
    errorMessage,
    warningMessage,
  } = searchboxProps;

  return (
    <div className="relative group z-50">
      <div className="flex flex-col gap-2 p-1.5 bg-background/80 backdrop-blur-xl border shadow-sm rounded-2xl transition-all duration-300 hover:shadow-md hover:border-primary/20 focus-within:shadow-lg focus-within:border-primary/30">
        <div className="flex items-center gap-2 pl-3 pr-1.5 py-1">
          <Textarea
            ref={inputRef}
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => refine(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-[44px] max-h-[200px] py-2.5 px-0 border-none shadow-none focus-visible:ring-0 resize-none bg-transparent text-base placeholder:text-muted-foreground/50 leading-relaxed"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
              >
                Clear
              </Button>
            )}
            {showMic && (
              <Button
                type="button"
                variant={micVariant === "destructive" ? "destructive" : micPressed ? "default" : "secondary"}
                size="icon"
                onClick={handleMicToggle}
                disabled={micDisabled}
                aria-pressed={micPressed}
                className={`h-9 w-9 rounded-xl transition-all duration-300 ${
                  micPressed 
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 shadow-lg scale-105" 
                    : "hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <MicrophoneIcon micOpen={micPressed} />
              </Button>
            )}
          </div>
        </div>
      </div>
      {errorMessage && (
        <p className="absolute top-full left-4 mt-2 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
          {errorMessage}
        </p>
      )}
      {warningMessage && (
        <p className="absolute top-full left-4 mt-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-top-1">
          {warningMessage}
        </p>
      )}
    </div>
  );
};
