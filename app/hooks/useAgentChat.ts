"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { getObjectsByIds, UpdateSuggestion } from "@/lib/getObjectByIDs";
import config from "@/lib/constants";
import { SummaryWithSourcesInput,SummaryWithSourcesToolUIPart } from "../components/agent/tools/SummaryWithSourcesTool";
import { Article } from "@/lib/types/Product";
import { useSpeechSettings } from "../context/SpeechSettingsContext";
import { useHits, useSearchBox } from "react-instantsearch";
import type { Suggestion } from "@/app/components/search/Suggestions";
import { UIMessage } from "@ai-sdk/react";
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
      if (
        toolCall.toolCall.toolName === "summary-with-sources"
      ) {
        const input = toolCall.toolCall.input as SummaryWithSourcesInput;

        const indexName = config.verticals.articles.indexName;

        const allObjectIds = input.items?.flatMap((item) => item.objectIds) || [];
        const uniqueObjectIds = Array.from(new Set(allObjectIds));

        const articles = await getObjectsByIds<Article>(uniqueObjectIds, indexName);

        // Attach the tool input to the suggestion corresponding to the latest query.
        if (lastSubmittedQueryRef.current) {
          await UpdateSuggestion(
            lastSubmittedQueryRef.current,
            undefined,
            input
          );
        }


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
  const { refine: refineRootQuery } = useSearchBox();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Track last query/result IDs to update the related suggestion when tool output arrives.
  const lastSubmittedQueryRef = useRef<string | null>(null);
  const lastResultObjectIdsRef = useRef<string[] | null>(null);
  const latestResultsRef = useRef<typeof results | null>(results);

  const arraysEqualIgnoreOrder = (a: string[] = [], b: string[] = []) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  const diffArrays = (a: string[] = [], b: string[] = []) => {
    const setA = new Set(a);
    const setB = new Set(b);
    const onlyInA = a.filter((id) => !setB.has(id));
    const onlyInB = b.filter((id) => !setA.has(id));
    return { onlyInA, onlyInB };
  };

  const { language, setLanguage } = useSpeechSettings();
  const [supported, setSupported] = useState(false);
  const [supportChecked, setSupportChecked] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    latestResultsRef.current = results;
  }, [results]);

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



  const constructAgentMessage = useCallback(
    (userQuery: string, topResults: Article[]) => {
      const top10 = topResults.slice(0, 1);
      const items = top10.map((hit) => `- ${hit.title}, ${hit.objectID}, ${hit.article}`).join("\n");
      return `Query: ${userQuery}\nTop results:\n${items}`.trim();
    },
    []
  );

  const handleSubmit = useCallback(
    async (query: string) => {
      const text = query.trim();
      if (!text) return;

      // Keep InstantSearch as the single source of truth: update the root query,
      // then wait for matching results before sending to the agent.
      refineRootQuery(text);

      const waitForResults = async () => {
        const target = text.toLowerCase();
        const timeoutMs = 600;
        const stepMs = 50;
        const start = performance.now();

        while (performance.now() - start < timeoutMs) {
          const current = latestResultsRef.current;
          const currentQuery = current?.query?.toLowerCase();
          if (currentQuery === target) {
            return current;
          }
          await new Promise((resolve) => setTimeout(resolve, stepMs));
        }
        return latestResultsRef.current;
      };

      console.log("messages", messages);

      const freshResults = await waitForResults();
      const hits = (freshResults?.hits as Article[]) ?? results?.hits ?? [];
      const suggestion = (await getObjectsByIds<Suggestion>([query], "news_paper_generic_v2_query_suggestions"))[0];


      // Normalize current hit IDs: dedupe, cap at 10, and keep stable order.
      const result_object_ids = Array.from(new Set(hits.map((hit) => hit.objectID))).slice(0, 1);
      const result_names = hits.slice(0, 1).map((hit) => hit.title);
      console.log("result_names", result_names);
      console.log("result_object_ids", result_object_ids);

      const suggestion_object_ids = suggestion?.result_object_ids ?? [];



      // Remember the latest query and result IDs so we can update its suggestion with tool output.
      lastSubmittedQueryRef.current = text;
      lastResultObjectIdsRef.current = result_object_ids;

      console.groupCollapsed("handleSubmit suggestion click");
      console.log("submitted text", text);
      console.log("instantsearch refine query", text);
      console.log("hit count", hits.length);
      console.log("hit IDs", result_object_ids);
      console.log("hit titles", result_names);
      console.log("fetched suggestion", suggestion);
      console.log("suggestion_object_ids", suggestion_object_ids);
      console.log("suggestion_object_ids length", suggestion_object_ids.length);
      console.log("result_object_ids length", result_object_ids.length);
      console.log(
        "arraysEqualIgnoreOrder",
        arraysEqualIgnoreOrder(suggestion_object_ids, result_object_ids)
      );
      const diffSuggestionVsResult = diffArrays(suggestion_object_ids, result_object_ids);
      const diffResultVsSuggestion = diffArrays(result_object_ids, suggestion_object_ids);
      console.log("array diff (suggestion vs result)", diffSuggestionVsResult);
      console.log("array diff (result vs suggestion)", diffResultVsSuggestion);
      console.log("lastResultObjectIdsRef", lastResultObjectIdsRef.current);
      console.log(
        "last vs current equal",
        arraysEqualIgnoreOrder(lastResultObjectIdsRef.current ?? [], result_object_ids)
      );
      console.groupEnd();

      const arraysMatch = arraysEqualIgnoreOrder(suggestion_object_ids, result_object_ids);
      const nearMatch =
        suggestion &&
        suggestion.tool_output &&
        diffSuggestionVsResult.onlyInA.length <= 1 &&
        diffSuggestionVsResult.onlyInB.length <= 1 &&
        diffResultVsSuggestion.onlyInA.length <= 1 &&
        diffResultVsSuggestion.onlyInB.length <= 1;

      if (suggestion && suggestion.tool_output && (arraysMatch || nearMatch)) {
        if (!arraysMatch) {
          // Keep Algolia in sync if we detected a near-match but with slight drift.
          await UpdateSuggestion(query, result_object_ids, suggestion.tool_output);
        }

        messages.push({
          role: "user",
          id: "suggestion-found",
          parts: [{ type: "text", text: "Suggestion found: " + suggestion.query }],
        } as UIMessage);

        const toolPart: SummaryWithSourcesToolUIPart = {
          type: "tool-summary-with-sources",
          toolName: "summary-with-sources",
          toolCallId: "suggestion-found-agent",
          state: "output-available",
          input: suggestion.tool_output,
          output: { response: hits },
        };

        messages.push({
          role: "assistant",
          id: "suggestion-found-agent",
          type: "tool_call",
          toolCallId: "suggestion-found-agent",
          toolName: "summary-with-sources",
          parts: [toolPart],
        } as UIMessage<SummaryWithSourcesToolUIPart>);
        console.log("messages", messages);
      } else {
        // Send message to agent
        await UpdateSuggestion(query, result_object_ids);
        // Fetch back the suggestion to verify the update landed.
        const refreshedSuggestion = (await getObjectsByIds<Suggestion>(
          [query],
          "news_paper_generic_v2_query_suggestions"
        ))[0];
        const refreshedIds = refreshedSuggestion?.result_object_ids ?? [];
        console.groupCollapsed("post-update suggestion fetch");
        console.log("refreshed suggestion", refreshedSuggestion);
        console.log("refreshed result_object_ids", refreshedIds);
        console.log(
          "arraysEqualIgnoreOrder (post-update)",
          arraysEqualIgnoreOrder(refreshedIds, result_object_ids)
        );
        console.groupEnd();

        const agentMessage = constructAgentMessage(text, hits);

        sendMessage({ text: agentMessage });
      }

    },
    [constructAgentMessage, refineRootQuery, results, sendMessage, messages]
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
