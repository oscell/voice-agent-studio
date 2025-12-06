"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

type UseSearchboxResult = {
    // Input state
    inputValue: string;
    setInputValue: (value: string) => void;
    inputRef: React.RefObject<HTMLTextAreaElement>;

    // Voice transcription state
    supported: boolean;
    listening: boolean;
    error?: string;

    // Event handlers
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    handleClear: () => void;
    handleMicToggle: () => void;

    // Mic button state
    micDisabled: boolean;
    micVariant: "destructive" | "default";
    micPressed: boolean;

    // Error/warning messages
    errorMessage?: string;
    warningMessage?: string;
};

/**
 * Comprehensive hook for SearchBox component that manages:
 * - Voice transcription via browser SpeechRecognition API
     * - Input value state and text merging from voice only
 * - All event handlers for the search box UI
 */
export const useSearchbox = (
    { sendMessage }: { sendMessage: (args: { text: string }) => void }
): UseSearchboxResult => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const lastVoiceTranscriptRef = useRef("");

    const [supported, setSupported] = useState(false);
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | undefined>(undefined);
    const [inputValue, setInputValue] = useState("");

    console.log("listening", listening);
    console.log("supported", supported);
    console.log("error", error);  console.log("inputValue", inputValue);
    console.log("transcript", transcript);
    console.log("lastVoiceTranscriptRef", lastVoiceTranscriptRef.current);
    // Initialize SpeechRecognition
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
        recognition.interimResults = true;
        recognition.lang = "en-US";

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
    }, []);


    // Reset input and all refs
    const resetInput = useCallback(() => {
        setInputValue("");
        lastVoiceTranscriptRef.current = "";
        setTranscript("");
    }, []);


    // Voice transcription controls
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

    useEffect(() => {
        // Start each streaming session with a clean transcript buffer
        if (listening) {
            setTranscript("");
        }
    }, [listening]);

    useEffect(() => {
        // Only append the captured transcript once the user stops talking
        if (!listening && transcript) {
            setInputValue((prev) =>
                prev.trim() ? `${prev.trim()} ${transcript}` : transcript
            );
        }
    }, [listening, transcript]);

    // Event handlers
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim()) {
                    sendMessage({ text: inputValue.trim() });
                    resetInput();
                }
            }
        },
        [inputValue, sendMessage, resetInput]
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

    // Computed values
    const micVariant: "destructive" | "default" =
        listening ? "destructive" : "default";
    const micPressed = listening;

    const errorMessage = error
        ? `${error} (browser SpeechRecognition)`
        : undefined;

    const warningMessage =
        !supported && !error
            ? "SpeechRecognition unavailable; Deepgram stream remains enabled."
            : undefined;

    return {
        inputValue,
        setInputValue,
        inputRef,
        supported,
        listening,
        error,
        handleKeyDown,
        handleClear,
        handleMicToggle,
        micDisabled,
        micVariant,
        micPressed,
        errorMessage,
        warningMessage,
    };
};

