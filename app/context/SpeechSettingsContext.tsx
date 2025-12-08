"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en-US" | "fr-FR";

type SpeechSettingsContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const SpeechSettingsContext = createContext<SpeechSettingsContextValue | null>(null);

export const SpeechSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en-US");

  return (
    <SpeechSettingsContext.Provider value={{ language, setLanguage }}>
      {children}
    </SpeechSettingsContext.Provider>
  );
};

export const useSpeechSettings = () => {
  const ctx = useContext(SpeechSettingsContext);
  if (!ctx) {
    throw new Error("useSpeechSettings must be used within a SpeechSettingsProvider");
  }
  return ctx;
};
