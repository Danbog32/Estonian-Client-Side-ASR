"use client";

import { useSettings } from "../providers/SettingsContext";

interface GreetingLoadingProps {
  loadingMessage?: string;
}

export default function GreetingLoading({
  loadingMessage,
}: GreetingLoadingProps) {
  const { language } = useSettings();

  const defaultMessage =
    language === "et"
      ? "Mudel laeb, palun oodake."
      : "The model is loading, please wait.";

  return (
    <div className="fixed inset-0 z-[40] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 px-6 max-w-sm">
        <div className="w-10 h-10 border-[3px] border-white/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-base text-white/70 text-center">
          {loadingMessage || defaultMessage}
        </p>
      </div>
    </div>
  );
}
