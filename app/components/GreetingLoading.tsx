"use client";

import React from "react";
import { Progress } from "@heroui/react";
import { useSettings } from "../providers/SettingsContext";

interface GreetingLoadingProps {
  loadingMessage?: string;
}

const GreetingLoading: React.FC<GreetingLoadingProps> = ({
  loadingMessage,
}) => {
  const { language } = useSettings() as { language: "en" | "et" };

  const translations = {
    en: {
      greeting: "Welcome!",
      info: "We provide an easy to use live captions experience which lives right inside your browser",
      loading: "The model is loading, please wait.",
    },
    et: {
      greeting: "Tere tulemast!",
      info: "Selle kasutajaliidese abil saab kasutada kõnetuvastust otse brauseris",
      loading: "Mudel laeb, palun oodake.",
    },
  };

  const t = translations[language] || translations.en;
  const currentLoadingMessage = loadingMessage || t.loading;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn z-[40]">
      <div
        className="flex flex-col items-center justify-center text-balance gap-3 sm:gap-6 
        bg-gray-800/90 border border-gray-700/50 max-w-[90%] lg:max-w-[38rem] md:max-w-[32rem] sm:max-w-[28rem]
        rounded-xl shadow-2xl p-6 sm:p-8 transition-all"
      >
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent mb-2 animate-slideInDown">
          {t.greeting}
        </h1>

        <div className="w-20 h-1 bg-primary/30 rounded-full mb-4 animate-pulse"></div>

        <p className="text-medium sm:text-lg text-gray-300 mb-4 text-center max-w-[90%] leading-relaxed animate-fadeIn">
          {t.info}
        </p>

        <div className="w-full px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-3 animate-fadeIn">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <p className="text-medium text-gray-400">{currentLoadingMessage}</p>
          </div>

          <Progress
            size="md"
            isIndeterminate
            aria-label="Loading..."
            className="w-full animate-pulse"
            color="primary"
          />
        </div>
      </div>
    </div>
  );
};

export default GreetingLoading;
