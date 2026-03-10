"use client";

import { Mic, Square, Trash2 } from "lucide-react";
import { useSettings } from "../providers/SettingsContext";

interface FloatingMicButtonProps {
  isRecording: boolean;
  isDisabled: boolean;
  hasTranscript: boolean;
  onToggle: () => void;
  onClear: () => void;
}

export default function FloatingMicButton({
  isRecording,
  isDisabled,
  hasTranscript,
  onToggle,
  onClear,
}: FloatingMicButtonProps) {
  const { language } = useSettings() as { language: "en" | "et" };

  const labels = {
    en: { start: "Start", stop: "Stop", clear: "Clear" },
    et: { start: "Alusta", stop: "Peata", clear: "Puhasta" },
  };
  const t = labels[language];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex items-end justify-center gap-4 pointer-events-none"
      style={{
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {hasTranscript && !isRecording && (
        <button
          onClick={onClear}
          className="pointer-events-auto w-12 h-12 rounded-full grid place-items-center bg-black/60 backdrop-blur-sm border border-white/15 text-white/70 transition-all hover:bg-black/80 active:scale-95 mb-1"
          aria-label={t.clear}
        >
          <Trash2 size={18} />
        </button>
      )}

      <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
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
        <span className="text-xs text-white/60 select-none">
          {isDisabled ? "..." : isRecording ? t.stop : t.start}
        </span>
      </div>
    </div>
  );
}
