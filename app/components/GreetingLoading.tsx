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
      info: "We provide an easy to use live captions experience which lives right inside your browser.",
      loading: "The model is loading, please wait.",
    },
    et: {
      greeting: "Tere tulemast!",
      info: "Pakume lihtsat kasutajaliidest otse teie brauseris elava otsekirjelduse kogemuse jaoks.",
      loading: "Mudel laeb, palun oodake.",
    },
  };

  const t = translations[language] || translations.en;
  const currentLoadingMessage = loadingMessage || t.loading;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 rounded-lg shadow-lg bg-gray-700">
        <h1 className="text-4xl font-bold text-white mb-4">{t.greeting}</h1>
        <div>
          <p className="text-lg text-gray-300 mb-2 text-center">{t.info}</p>
          <p className="text-lg text-gray-300 mb-4 text-center">
            {currentLoadingMessage}
          </p>
        </div>

        <Progress
          size="md"
          isIndeterminate
          aria-label="Loading..."
          className="w-full max-w-md"
        />
      </div>
    </div>
  );
};

export default GreetingLoading;
