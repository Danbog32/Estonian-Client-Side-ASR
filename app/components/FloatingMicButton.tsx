"use client";

import { useState } from "react";
import { Mic, Square, Trash2, ArrowDown, Copy, Check } from "lucide-react";
import { useSettings } from "../providers/SettingsContext";

interface FloatingMicButtonProps {
  isRecording: boolean;
  isDisabled: boolean;
  hasTranscript: boolean;
  isScrolledUp: boolean;
  onToggle: () => void;
  onClear: () => void;
  onScrollToBottom: () => void;
  onCopyAll: () => Promise<void>;
}

export default function FloatingMicButton({
  isRecording,
  isDisabled,
  hasTranscript,
  isScrolledUp,
  onToggle,
  onClear,
  onScrollToBottom,
  onCopyAll,
}: FloatingMicButtonProps) {
  const { language } = useSettings() as { language: "en" | "et" };
  const [copiedAll, setCopiedAll] = useState(false);

  const labels = {
    en: { start: "Start", stop: "Stop", clear: "Clear", copy: "Copy all" },
    et: {
      start: "Alusta",
      stop: "Peata",
      clear: "Puhasta",
      copy: "Kopeeri kõik",
    },
  };
  const t = labels[language];

  const handleCopyAll = async () => {
    try {
      await onCopyAll();
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* clipboard write failed */
    }
  };

  const sideButtonClass =
    "w-12 h-12 rounded-full grid place-items-center bg-black/60 backdrop-blur-sm border border-white/15 text-white/70 transition-all hover:bg-black/80 active:scale-95";

  const scrollButtonClass =
    "w-10 h-10 rounded-full grid place-items-center bg-black/70 backdrop-blur-sm border border-white/15 text-white/80 transition-all hover:bg-black/90 active:scale-95";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center pointer-events-none"
      style={{
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="relative pointer-events-auto">
        {/* Scroll to bottom — above mic when stopped, left of stop when recording */}
        {isScrolledUp && !isRecording && hasTranscript && (
          <button
            onClick={onScrollToBottom}
            className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 ${scrollButtonClass}`}
            aria-label="Scroll to bottom"
          >
            <ArrowDown size={18} />
          </button>
        )}

        {isScrolledUp && isRecording && (
          <button
            onClick={onScrollToBottom}
            className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 ${scrollButtonClass}`}
            aria-label="Scroll to bottom"
          >
            <ArrowDown size={18} />
          </button>
        )}

        {/* Trash — left of mic when stopped with transcript */}
        {hasTranscript && !isRecording && (
          <button
            onClick={onClear}
            className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 ${sideButtonClass}`}
            aria-label={t.clear}
          >
            <Trash2 size={18} />
          </button>
        )}

        {/* Main mic / stop button — always centered */}
        <button
          onClick={onToggle}
          disabled={isDisabled}
          className={`
            w-16 h-16 rounded-full grid place-items-center transition-all
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
            ${
              isDisabled
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : isRecording
                  ? "bg-red-600 text-white animate-mic-pulse"
                  : "bg-blue-600 text-white shadow-lg hover:bg-blue-500 active:scale-95"
            }
          `}
          aria-label={isRecording ? t.stop : t.start}
          aria-pressed={isRecording}
        >
          {isRecording ? (
            <Square size={24} fill="currentColor" />
          ) : (
            <Mic size={28} />
          )}
        </button>

        {/* Copy all — right of mic when stopped with transcript */}
        {hasTranscript && !isRecording && (
          <button
            onClick={handleCopyAll}
            className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 ${sideButtonClass}`}
            aria-label={t.copy}
          >
            {copiedAll ? <Check size={18} /> : <Copy size={18} />}
          </button>
        )}
      </div>

      <span className="text-xs text-white/60 select-none mt-1.5">
        {isDisabled ? "..." : isRecording ? t.stop : t.start}
      </span>
    </div>
  );
}
