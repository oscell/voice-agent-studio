import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { MicrophoneIcon } from "../icons/MicrophoneIcon";

export const SearchBox = ({
  sendMessage,
  caption,
  isStreaming,
  toggleStreaming,
}: {
  sendMessage: (args: { text: string }) => void;
  caption?: string;
  isStreaming: boolean;
  toggleStreaming: () => void;
}) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCaptionRef = useRef("");

  const resetInput = () => {
    setInputValue("");
    lastCaptionRef.current = "";
  };

  useEffect(() => {
    if (!caption || caption.trim() === "") {
      return;
    }

    setInputValue((prev) => {
      const trimmedCaption = caption.trim();
      const lastCaption = lastCaptionRef.current;

      if (trimmedCaption === lastCaption) {
        return prev;
      }

      if (!prev.trim()) {
        lastCaptionRef.current = trimmedCaption;
        return trimmedCaption;
      }

      let addition = trimmedCaption;

      if (lastCaption && trimmedCaption.startsWith(lastCaption)) {
        addition = trimmedCaption.slice(lastCaption.length).trimStart();
      }

      if (!addition) {
        lastCaptionRef.current = trimmedCaption;
        return prev;
      }

      const needsSpace = prev && !prev.endsWith(" ") && !addition.startsWith(" ");
      const nextValue = `${prev}${needsSpace ? " " : ""}${addition}`;

      lastCaptionRef.current = trimmedCaption;
      return nextValue;
    });
  }, [caption]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      sendMessage({ text: inputValue.trim() });
      resetInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex-1 flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            resetInput();
            inputRef.current?.focus();
          }}
          disabled={!inputValue}
          aria-label="Clear search input"
        >
          Clear
        </Button>
        <Button
          type="button"
          variant={isStreaming ? "destructive" : "default"}
          onClick={toggleStreaming}
          aria-pressed={isStreaming}
        >
          <MicrophoneIcon micOpen={isStreaming} />
        </Button>
      </div>
    </div>
  );
};
