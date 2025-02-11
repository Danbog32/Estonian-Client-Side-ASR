"use client";

import React from "react";
import { useSettings } from "./SettingsContext";

interface StartPromptProps {}

const StartPrompt: React.FC<StartPromptProps> = () => {
  const { language } = useSettings() as { language: "en" | "et" };

  const translations = {
    en: {
      heading: "Ready to Talk?",
      info: "When you're ready, press the start button and begin speaking",
    },
    et: {
      heading: "Valmis rääkima?",
      info: "Kui olete valmis, vajutage käivitusnuppu ja alustage rääkimist",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn">
        <div
          className="flex flex-col items-center justify-center gap-1 sm:gap-4 
               bg-gray-700 max-w-[85%] sm:max-w-[70%] md:max-w-[50%] lg:max-w-[40%] 
               rounded-lg shadow-lg py-4 px-6 sm:py-8 animate-fadeIn"
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 animate-slideInDown text-center">
            {t.heading}
          </h1>
          <p className="text-lg text-gray-300 mb-6 text-center animate-fadeIn">
            {t.info}
          </p>
          {/* Animated arrow pointing upward */}
          <div className="animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-12 h-12 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20V4M12 4L6 10M12 4L18 10"
              />
            </svg>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-in-out;
        }
        @keyframes slideInDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideInDown {
          animation: slideInDown 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default StartPrompt;
