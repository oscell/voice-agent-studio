"use client";

import { Button } from "@/components/ui/button";
import { MicrophoneIcon } from "../icons/MicrophoneIcon";
import { Textarea } from "@/components/ui/textarea";
import type { UseSearchboxResult } from "../../hooks/useSearchbox";

export const SearchBox = ({
  sendMessage,
  ...searchboxProps
}: {
  sendMessage: (args: { text: string }) => void;
} & Omit<UseSearchboxResult, "listening">) => {
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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex-1 flex items-start gap-2">
        <Textarea
          ref={inputRef}
          placeholder="Ask me anything..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="min-h-10 border-none"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleClear}
          disabled={!inputValue}
          aria-label="Clear search input"
        >
          Clear
        </Button>
        <Button
          type="button"
          variant={micVariant}
          onClick={handleMicToggle}
          disabled={micDisabled}
          aria-pressed={micPressed}
          aria-label="Press and hold to talk"
        >
          <MicrophoneIcon micOpen={micPressed} />
        </Button>
      </div>
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      {warningMessage && (
        <p className="text-sm text-muted-foreground">{warningMessage}</p>
      )}
    </div>
  );
};
