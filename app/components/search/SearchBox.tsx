import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

export const SearchBox = ({ sendMessage, caption }: { sendMessage: (args: { text: string }) => void, caption?: string }) => {

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
    <>
        <Input 
          type="text" 
          placeholder="Search" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
    </>
  );
};