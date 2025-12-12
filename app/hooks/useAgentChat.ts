"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { getObjectsByIds } from "@/lib/getObjectByIDs";
import config from "@/lib/constants";
import { DisplayItemsInput } from "../components/agent/tools/DisplayItemsTool";
import { SummaryWithSourcesInput } from "../components/agent/tools/SummaryWithSourcesTool";
import { Article } from "@/lib/types/Product";
import { useSpeechSettings } from "../context/SpeechSettingsContext";
import { useHits } from "react-instantsearch";

export type UseAgentChatResult = {
  // Agent chat state
  messages: ReturnType<typeof useChat>["messages"];
  status: "submitted" | "streaming" | "ready" | "error";
  sendMessage: (args: { text: string }) => void;

  // Input state
  inputValue: string;
  setInputValue: (value: string) => void;
  inputRef: RefObject<HTMLTextAreaElement>;

  // Voice transcription state
  supported: boolean;
  listening: boolean;
  error?: string;

  // Event handlers
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleClear: () => void;
  handleMicToggle: () => void;
  handleSubmit: (query: string) => void;

  // Mic button state
  micDisabled: boolean;
  micVariant: "destructive" | "default";
  micPressed: boolean;

  // Error/warning messages
  errorMessage?: string;
  warningMessage?: string;
  language: "en-US" | "fr-FR" | "es-ES" | "it-IT" | "de-DE";
  setLanguage: (lang: "en-US" | "fr-FR" | "es-ES" | "it-IT" | "de-DE") => void;
};

/**
 * Unified hook for the agent chat and search box UX.
 * Combines Algolia Agent transport + voice transcription + input handling
 * so the UI can stay dumb/presentational.
 */
export const useAgentChat = (): UseAgentChatResult => {
  const {
    messages,
    sendMessage,
    addToolOutput,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!}.algolia.net/agent-studio/1/agents/${process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID!}/completions?stream=true&compatibilityMode=ai-sdk-5`,
      headers: {
        "x-algolia-application-id": process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        "x-algolia-api-key": process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!,
      },
    }),
    onToolCall: async (toolCall) => {
      if (toolCall.toolCall.toolName === "display-items") {
        const input = toolCall.toolCall.input as DisplayItemsInput;
        const indexName = config.verticals.articles.indexName;
        const products = await getObjectsByIds<Article>(input.objectIDs, indexName);

        addToolOutput({
          tool: toolCall.toolCall.toolName,
          toolCallId: toolCall.toolCall.toolCallId,
          state: "output-available",
          output: {
            response: products,
          },
        });
      } else if (
        toolCall.toolCall.toolName === "summary-with-sources"
      ) {
        const input = toolCall.toolCall.input as SummaryWithSourcesInput;
        const indexName = config.verticals.articles.indexName;

        const allObjectIds = input.items?.flatMap((item) => item.objectIds) || [];
        const uniqueObjectIds = Array.from(new Set(allObjectIds));

        const articles = await getObjectsByIds<Article>(uniqueObjectIds, indexName);


        addToolOutput({
          tool: toolCall.toolCall.toolName,
          toolCallId: toolCall.toolCall.toolCallId,
          state: "output-available",
          output: {
            response: articles,
          },
        });


      }
    },
  });

  const { results } = useHits<Article>();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { language, setLanguage } = useSpeechSettings();
  const [supported, setSupported] = useState(false);
  const [supportChecked, setSupportChecked] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      setError("SpeechRecognition API unavailable in this browser.");
      setSupportChecked(true);
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionCtor();
    recognition.continuous = false; // press-to-talk
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setListening(true);
      setError(undefined);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event) => {
      setListening(false);
      const errorCode = event.error;
      if (errorCode === "no-speech" || errorCode === "aborted") {
        setError(undefined);
      } else {
        setError(errorCode || "speech-recognition-error");
      }
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
    setSupportChecked(true);

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [language]);

  // Reset input and all refs
  const resetInput = useCallback(() => {
    setInputValue("");
    setTranscript("");
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (listening) return;
    try {
      recognitionRef.current.start();
    } catch {
      setError("Unable to start speech recognition.");
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);


  useEffect(() => {
    if (!listening && transcript) {
      const finalText = inputValue.trim()
        ? `${inputValue.trim()} ${transcript}`
        : transcript;

      sendMessage({ text: finalText });
      setInputValue(finalText);
      setTranscript("");
    }
  }, [listening, transcript, inputValue, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (inputValue.trim()) {
          sendMessage({ text: inputValue.trim() });
        }
      }
    },
    [inputValue, sendMessage]
  );

  const handleSubmit = useCallback(
    (query: string) => {
      const text = query.trim();
      if (!text) return;

      const hits = results?.hits ?? [];
      // TODO: optionally enrich the message with hits if needed.
      void hits;

      sendMessage({ text });
      setInputValue(text);

    },
    [results, sendMessage, setInputValue]
  );

  const handleClear = useCallback(() => {
    resetInput();
    inputRef.current?.focus();
  }, [resetInput]);

  const micDisabled = !supported || !!error;

  const handleMicToggle = useCallback(() => {
    if (micDisabled) return;
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [micDisabled, listening, startListening, stopListening]);

  const micVariant: "destructive" | "default" = listening ? "destructive" : "default";
  const micPressed = listening;

  const errorMessage = error ? `${error} (browser SpeechRecognition)` : undefined;
  const warningMessage = useMemo(() => {
    if (!supportChecked || supported || error) {
      return undefined;
    }
    return "Voice input not supported in this browser.";
  }, [supportChecked, supported, error]);

  return {
    messages,
    status,
    sendMessage,
    inputValue,
    setInputValue,
    inputRef,
    supported,
    listening,
    error,
    handleKeyDown,
    handleSubmit,
    handleClear,
    handleMicToggle,
    micDisabled,
    micVariant,
    micPressed,
    errorMessage,
    warningMessage,
    language,
    setLanguage,
  };
};
