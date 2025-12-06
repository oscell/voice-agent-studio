"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

type UseVoiceTranscriptionOptions = {
  lang?: string;
  interimResults?: boolean;
};

type UseVoiceTranscriptionResult = {
  supported: boolean;
  listening: boolean;
  transcript: string;
  error?: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
  applyIncomingText: (incoming: string, sourceRef: MutableRefObject<string>) => void;
  resetInput: () => void;
};

/**
 * Thin wrapper around the browser SpeechRecognition API for press-to-talk.
 * Note: We currently keep the Deepgram streaming flow in the app; remove that
 * once SpeechRecognition fully replaces it.
 */
export const useVoiceTranscription = (
  options?: UseVoiceTranscriptionOptions
): UseVoiceTranscriptionResult => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");
  const lastVoiceTranscriptRef = useRef("");


  useEffect(() => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      setError("SpeechRecognition API unavailable in this browser.");
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionCtor();
    recognition.continuous = false; // press-to-talk
    recognition.interimResults = options?.interimResults ?? true;
    recognition.lang = options?.lang ?? "en-US";

    recognition.onstart = () => {
      setListening(true);
      setError(undefined);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event) => {
      setListening(false);
      setError(event.error || "speech-recognition-error");
    };

    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
      setTranscript(nextTranscript);
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [options?.interimResults, options?.lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (listening) return;
    try {
      recognitionRef.current.start();
    } catch (err) {
      setError("Unable to start speech recognition.");
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
  }, []);

  const applyIncomingText = useCallback(
    (incoming: string, sourceRef: MutableRefObject<string>) => {
      if (!incoming || incoming.trim() === "") {
        return;
      }

      setInputValue((prev) => {
        const trimmedIncoming = incoming.trim();
        const lastSeen = sourceRef.current;

        if (trimmedIncoming === lastSeen) {
          return prev;
        }

        if (!prev.trim()) {
          sourceRef.current = trimmedIncoming;
          return trimmedIncoming;
        }

        let addition = trimmedIncoming;

        if (lastSeen && trimmedIncoming.startsWith(lastSeen)) {
          addition = trimmedIncoming.slice(lastSeen.length).trimStart();
        }

        if (!addition) {
          sourceRef.current = trimmedIncoming;
          return prev;
        }

        const needsSpace =
          prev && !prev.endsWith(" ") && !addition.startsWith(" ");
        const nextValue = `${prev}${needsSpace ? " " : ""}${addition}`;

        sourceRef.current = trimmedIncoming;
        return nextValue;
      });
    },
    []
  );

  const resetInput = useCallback(() => {
    setInputValue("");
    lastVoiceTranscriptRef.current = "";
    reset();
  }, [reset]);

  // Auto-apply voice transcript to input value
  useEffect(() => {
    if (!transcript) return;
    applyIncomingText(transcript, lastVoiceTranscriptRef);
  }, [transcript, applyIncomingText]);

  return {
    supported,
    listening,
    transcript,
    error,
    inputValue,
    setInputValue,
    startListening,
    stopListening,
    reset,
    applyIncomingText,
    resetInput,
  };
};

