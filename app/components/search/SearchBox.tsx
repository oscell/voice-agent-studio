"use client";

import { Button } from "@/components/ui/button";
import { MicrophoneIcon } from "../icons/MicrophoneIcon";
import { Textarea } from "@/components/ui/textarea";
import { useSearchbox } from "../../hooks/useSearchbox";

export const SearchBox = ({
  sendMessage,
}: {
  sendMessage: (args: { text: string }) => void;
}) => {
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
  } = useSearchbox({ sendMessage });

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
          className="min-h-10"
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
