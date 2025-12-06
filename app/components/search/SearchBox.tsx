"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { MicrophoneIcon } from "../icons/MicrophoneIcon";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceTranscription } from "../../hooks/useVoiceTranscription";

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastCaptionRef = useRef("");

  const {
    supported: voiceSupported,
    listening,
    error: voiceError,
    inputValue,
    setInputValue,
    startListening,
    stopListening,
    applyIncomingText,
    resetInput,
  } = useVoiceTranscription();

  useEffect(() => {
    if (!caption || caption.trim() === "") {
      return;
    }

    applyIncomingText(caption, lastCaptionRef);
  }, [caption, applyIncomingText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        sendMessage({ text: inputValue.trim() });
        resetInput();
        lastCaptionRef.current = "";
      }
    }
  };

  const handleClear = () => {
    resetInput();
    lastCaptionRef.current = "";
    inputRef.current?.focus();
  };

  const micDisabled = !voiceSupported || !!voiceError;

  const handleMicPointerDown = () => {
    if (micDisabled) return;
    startListening();
  };

  const handleMicPointerUp = () => {
    if (micDisabled) return;
    stopListening();
  };

  const handleMicClick = () => {
    // TODO: remove Deepgram toggle once SpeechRecognition replaces streaming.
    toggleStreaming();
  };

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
          variant={listening || isStreaming ? "destructive" : "default"}
          onPointerDown={handleMicPointerDown}
          onPointerUp={handleMicPointerUp}
          onPointerLeave={handleMicPointerUp}
          onClick={handleMicClick}
          disabled={micDisabled}
          aria-pressed={listening || isStreaming}
          aria-label="Press and hold to talk"
        >
          <MicrophoneIcon micOpen={listening || isStreaming} />
        </Button>
      </div>
      {voiceError && (
        <p className="text-sm text-destructive">
          {voiceError} (browser SpeechRecognition)
        </p>
      )}
      {!voiceSupported && !voiceError && (
        <p className="text-sm text-muted-foreground">
          SpeechRecognition unavailable; Deepgram stream remains enabled.
        </p>
      )}
    </div>
  );
};
