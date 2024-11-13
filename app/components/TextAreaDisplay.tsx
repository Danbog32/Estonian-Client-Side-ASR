// components/TextAreaDisplay.jsx

"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from "@nextui-org/react";
import { Icons } from "./icons"; // Adjust the path as necessary
import { useSettings } from "./SettingsContext"; // Adjust the path as necessary

interface TextAreaDisplayProps {
  textSize: number;
  lineHeight: number;
}

const TextAreaDisplay: React.FC<TextAreaDisplayProps> = ({
  textSize,
  lineHeight,
}) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const { language } = useSettings() as { language: "en" | "et" };

  // Translations for different languages
  const translations = {
    en: {
      copyText: "Copy text",
      textCopied: "Text copied!",
      copyFailed: "Failed to copy text.",
      clickToCopy: "Click to copy the text",
    },
    et: {
      copyText: "Kopeeri tekst",
      textCopied: "Tekst kopeeritud!",
      copyFailed: "Teksti kopeerimine ebaõnnestus.",
      clickToCopy: "Klõpsa teksti kopeerimiseks",
    },
  };

  // Get the appropriate translations based on the selected language
  const t = translations[language] || translations.en;

  const copyText = () => {
    const textarea = document.getElementById("results") as HTMLTextAreaElement;
    if (textarea) {
      textarea.select();
      try {
        const successful = document.execCommand("copy");
        if (successful) {
          setPopoverVisible(true);
        } else {
          console.error("Copy command was unsuccessful.");
        }
      } catch (err) {
        console.error("Copy command failed:", err);
      }
      document.getSelection()?.removeAllRanges();
    }
  };

  return (
    <div className="relative w-full h-full mb-4">
      <textarea
        id="results"
        rows={5}
        readOnly
        className="w-full p-2 border rounded bg-gray-700 text-white font-mono h-full custom-scrollbar"
        style={{
          resize: "vertical",
          fontSize: `${textSize}rem`,
          lineHeight: lineHeight,
          height: "400px", // fixed height
        }}
      ></textarea>

      <Popover
        placement="top"
        isOpen={popoverVisible}
        onOpenChange={(isOpen) => setPopoverVisible(isOpen)}
      >
        <PopoverTrigger>
          <Button
            variant="bordered"
            className="absolute bottom-6 right-5 text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
            onClick={copyText}
            onMouseLeave={() => setPopoverVisible(false)}
          >
            <Icons.copy size={25} color="white" />
            {t.copyText}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="px-1 py-2">
            <div className="text-small font-bold">{t.textCopied}</div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TextAreaDisplay;
