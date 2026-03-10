"use client";

import { Mic } from "lucide-react";
import { useSettings } from "../providers/SettingsContext";

export default function StartSpeakingPrompt() {
  const { language } = useSettings() as { language: "en" | "et" };

  const text =
    language === "et" ? "Vajutage alustamiseks" : "Press to start";

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50dvh] gap-4 select-none">
      <Mic size={48} className="text-current opacity-20" strokeWidth={1.5} />
      <p className="text-lg opacity-40 text-center">{text}</p>
    </div>
  );
}
