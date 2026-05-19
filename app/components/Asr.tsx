"use client";

import { useState, useEffect, useRef } from "react";
import { useSettings } from "../providers/SettingsContext";
import CaptionDisplay from "./CaptionDisplay";
import GreetingLoading from "./GreetingLoading";
import TopBar from "./TopBar";
import FloatingMicButton from "./FloatingMicButton";
import SettingsDrawer from "./SettingsDrawer";
import AsrScriptBridge from "./AsrScriptBridge";

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
  const mobileTopBarReservedHeight =
    "calc(max(0.5rem, env(safe-area-inset-top)) + 45px + 1rem)";

  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptBlocks, setTranscriptBlocks] = useState<
    { text: string; previewSuffix?: string }[]
  >([]);
  const hasTranscript = transcriptBlocks.length > 0;
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const scrollToBottomRef = useRef<(() => void) | null>(null);
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
      setTranscriptBlocks(event.detail?.blocks || []);
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
    setTranscriptBlocks([]);
  };

  const handleCopyAll = async () => {
    const text = transcriptBlocks
      .map((b) => `${b.text}${b.previewSuffix || ""}`.trim())
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <div
      className="flex min-h-0 flex-col h-dvh w-full overflow-hidden transition-colors duration-200"
      style={{ backgroundColor }}
    >
      <AsrScriptBridge onLoad={() => console.log("app-asr loaded")} />

      {loading && <GreetingLoading loadingMessage={loadingMessage} />}

      <TopBar
        isRecording={isRecording}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div
        aria-hidden="true"
        className="shrink-0 md:hidden"
        style={{ height: mobileTopBarReservedHeight }}
      />

      <CaptionDisplay
        loading={loading}
        isRecording={isRecording}
        onScrollStateChange={setIsScrolledUp}
        scrollToBottomRef={scrollToBottomRef}
      />

      <FloatingMicButton
        isRecording={isRecording}
        isDisabled={loading}
        hasTranscript={hasTranscript}
        isScrolledUp={isScrolledUp}
        onToggle={handleToggleRecording}
        onClear={handleClear}
        onScrollToBottom={() => scrollToBottomRef.current?.()}
        onCopyAll={handleCopyAll}
      />

      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
