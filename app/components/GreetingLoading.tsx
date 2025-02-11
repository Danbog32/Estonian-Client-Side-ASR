"use client";

import React from "react";
import { Progress } from "@nextui-org/react";
import { useSettings } from "./SettingsContext";

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
      info: "Pakume lihtsat kasutajaliidest otse teie brauseris elava otsekirjelduse kogemuse jaoks",
      loading: "Mudel laeb, palun oodake.",
    },
  };

  const t = translations[language] || translations.en;
  const currentLoadingMessage = loadingMessage || t.loading;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn">
      <div
        className="flex flex-col items-center justify-center text-balance gap-1 sm:gap-4 bg-gray-700 
        max-w-[85%] lg:max-w-[40%] md:max-w-[50%] sm:max-w-[70%] rounded-lg shadow-lg py-4 px-2 sm:py-8"
      >
        <h1 className="text-2xl font-bold text-white mb-4 text-center sm:text-4xl animate-slideInDown">
          {t.greeting}
        </h1>

        <p className="text-medium sm:text-lg text-gray-300 mb-2 text-center max-w-[80%] animate-fadeIn">
          {t.info}
        </p>
        <div className="max-w-[80%]">
          <p className="text-medium sm:text-lg text-gray-300 mb-4 text-center animate-fadeIn">
            {currentLoadingMessage}
          </p>

          <Progress
            size="md"
            isIndeterminate
            aria-label="Loading..."
            className="w-full max-w-md"
          />
        </div>
      </div>
    </div>
  );
};

export default GreetingLoading;
