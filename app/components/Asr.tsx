"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useSettings } from "../providers/SettingsContext";
import CaptionDisplay from "./CaptionDisplay";
import GreetingLoading from "./GreetingLoading";
import TopBar from "./TopBar";
import FloatingMicButton from "./FloatingMicButton";
import SettingsDrawer from "./SettingsDrawer";

const translations = {
  en: {
    downloadingModel: "Downloading model, please wait...",
  },
  et: {
    downloadingModel: "Laen mudelit, palun oodake...",
  },
};

export default function Asr() {
  const { language, backgroundColor } = useSettings();

  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [hasTranscript, setHasTranscript] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const lang = language as "en" | "et";
  const loadingMessage =
    translations[lang]?.downloadingModel || translations.en.downloadingModel;

  useEffect(() => {
    const handleModelInitialized = () => setLoading(false);
    window.addEventListener("modelInitialized", handleModelInitialized);
    return () =>
      window.removeEventListener("modelInitialized", handleModelInitialized);
  }, []);

  useEffect(() => {
    const handleTranscriptUpdate = (event: CustomEvent) => {
      const blocks = event.detail?.blocks || [];
      setHasTranscript(blocks.length > 0);
    };
    window.addEventListener(
      "transcriptUpdate",
      handleTranscriptUpdate as EventListener,
    );
    return () =>
      window.removeEventListener(
        "transcriptUpdate",
        handleTranscriptUpdate as EventListener,
      );
  }, []);

  const handleToggleRecording = () => {
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");

    if (isRecording) {
      stopBtn?.click();
      setIsRecording(false);
    } else {
      startBtn?.click();
      setIsRecording(true);
    }
  };

  const handleClear = () => {
    document.getElementById("clearBtn")?.click();
    setHasTranscript(false);
  };

  return (
    <div
      className="flex flex-col h-dvh w-full overflow-hidden transition-colors duration-200"
      style={{ backgroundColor }}
    >
      <Script
        src="onnx/app-asr.js"
        strategy="afterInteractive"
        onLoad={() => console.log("app-asr loaded")}
      />

      {loading && <GreetingLoading loadingMessage={loadingMessage} />}

      <TopBar
        isRecording={isRecording}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <CaptionDisplay loading={loading} />

      <FloatingMicButton
        isRecording={isRecording}
        isDisabled={loading}
        hasTranscript={hasTranscript}
        onToggle={handleToggleRecording}
        onClear={handleClear}
      />

      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Hidden elements that app-asr.js attaches handlers to */}
      <div id="sound-clips" className="hidden" />
      <button id="startBtn" disabled className="hidden" />
      <button id="stopBtn" disabled className="hidden" />
      <button id="clearBtn" className="hidden" />
    </div>
  );
}
