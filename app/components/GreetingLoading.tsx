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
    },
    et: {
      greeting: "Tere tulemast!",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-white mb-4">{t.greeting}</h1>
      <p className="text-lg text-gray-300 mb-4">
        {loadingMessage || "Loading..."}
      </p>
      <Progress
        size="sm"
        isIndeterminate
        aria-label="Loading..."
        className="w-full max-w-md"
      />
    </div>
  );
};

export default GreetingLoading;
