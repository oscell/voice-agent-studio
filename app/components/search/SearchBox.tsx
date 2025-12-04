import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (caption) {
      setInputValue(caption);
    }
  }, [caption]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      sendMessage({ text: inputValue.trim() });
      setInputValue("");
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
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <Button
        type="button"
        variant={isStreaming ? "destructive" : "default"}
        onClick={toggleStreaming}
        aria-pressed={isStreaming}
      >
        {isStreaming ? "Stop voice" : "Start voice"}
      </Button>
    </div>
  );
};
