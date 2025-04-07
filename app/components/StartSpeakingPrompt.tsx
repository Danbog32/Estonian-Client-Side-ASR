"use client";

import React from "react";
import { useSettings } from "./SettingsContext";

interface StartPromptProps {}

const StartPrompt: React.FC<StartPromptProps> = () => {
  const { language } = useSettings() as { language: "en" | "et" };

  const translations = {
    en: {
      heading: "Ready to Start?",
      info: "Click the Start button in the top bar to begin speech recognition",
      tip: "For best results, speak clearly into your microphone",
    },
    et: {
      heading: "Valmis alustama?",
      info: "Kõnetuvastuse alustamiseks klõpsake ülariba nupul Alusta",
      tip: "Parimate tulemuste saamiseks rääkige mikrofoni selgelt",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="flex flex-col items-center justify-center gap-4 
             bg-gray-800/80 backdrop-blur-sm max-w-[85%] sm:max-w-[70%] md:max-w-[50%] lg:max-w-[40%] 
             rounded-xl shadow-lg py-6 px-6 animate-fadeIn border border-gray-700"
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-white animate-slideInDown text-center">
            {t.heading}
          </h1>
          <p className="text-lg text-gray-300 text-center animate-fadeIn">
            {t.info}
          </p>

          {/* Arrow pointing upward animation with hint */}
          <div className="flex flex-col items-center mt-4">
            <div className="animate-bounce">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8 text-blue-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19V5M12 5L5 12M12 5L19 12"
                />
              </svg>
            </div>
            <div className="flex items-center gap-2 mt-4 bg-gray-700/50 px-4 py-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-blue-400 min-w-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
              <span className="text-gray-300 text-sm">{t.tip}</span>
            </div>
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
