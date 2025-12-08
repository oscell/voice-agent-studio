"use client";

import { useSpeechSettings } from "../context/SpeechSettingsContext";

const LanguageSelect = () => {
  const { language, setLanguage } = useSpeechSettings();

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Language</span>
      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        value={language}
        onChange={(e) => setLanguage(e.target.value as "en-US" | "fr-FR")}
      >
        <option value="en-US">English</option>
        <option value="fr-FR">Français</option>
      </select>
    </label>
  );
};

export default LanguageSelect;
