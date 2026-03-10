"use client";

import { useState, useEffect } from "react";
import { Check, Copy, ArrowDown } from "lucide-react";
import StartSpeakingPrompt from "./StartSpeakingPrompt";
import { useSettings } from "../providers/SettingsContext";
import { useAutoScroll } from "../hooks/useAutoScroll";

const formatDisplayText = (text: string): string => {
  if (!text) return text;
  let s = text;
  s = s.replace(/\s+([,\.!\?;:])/g, "$1");
  s = s.replace(/([,\.!\?;:])(?!\s|$)/g, "$1 ");
  s = s.replace(/\s{2,}/g, " ");
  return s.trim();
};

interface TranscriptBlock {
  id: string;
  text: string;
  isComplete: boolean;
  timestamp: string;
  previewSuffix?: string;
}

interface CaptionDisplayProps {
  loading: boolean;
}

export default function CaptionDisplay({ loading }: CaptionDisplayProps) {
  const { textSize, lineHeight, textColor } = useSettings();

  const [transcriptBlocks, setTranscriptBlocks] = useState<TranscriptBlock[]>(
    [],
  );
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const lastBlockText =
    transcriptBlocks.length > 0
      ? transcriptBlocks[transcriptBlocks.length - 1]?.text
      : "";

  const { scrollRef, isScrolledUp, scrollToBottom } =
    useAutoScroll<HTMLDivElement>({
      content: lastBlockText,
      threshold: 100,
      buttonThreshold: 200,
    });

  useEffect(() => {
    const handleTranscriptUpdate = (event: CustomEvent) => {
      setTranscriptBlocks(event.detail.blocks || []);
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

  const handleCopyText = async (text: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBlockId(blockId);
      setTimeout(() => setCopiedBlockId(null), 1500);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full relative" role="main">
      <div id="transcriptText" className="hidden" />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth px-4 sm:px-6 pt-16 pb-28"
        style={{ color: textColor }}
        aria-live="polite"
      >
        {!loading && transcriptBlocks.length === 0 && <StartSpeakingPrompt />}

        <div className="max-w-3xl mx-auto space-y-4">
          {transcriptBlocks.map((block) => {
            const text = formatDisplayText(
              `${block.text}${block.previewSuffix || ""}`,
            );
            return (
              <div key={block.id} className="group relative">
                <p
                  className={`pr-10 break-words select-text transition-opacity ${
                    !block.isComplete ? "opacity-70" : ""
                  }`}
                  style={{ fontSize: `${textSize}rem`, lineHeight }}
                >
                  {text}
                </p>
                <button
                  onClick={() => handleCopyText(text, block.id)}
                  className="absolute top-1 right-0 w-8 h-8 grid place-items-center rounded-md
                    text-current opacity-0 group-hover:opacity-30 transition-opacity
                    hover:!opacity-60 focus-visible:opacity-60 focus-visible:outline-2 focus-visible:outline-blue-500"
                  aria-label="Copy"
                >
                  {copiedBlockId === block.id ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {isScrolledUp && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full
            grid place-items-center bg-black/70 backdrop-blur-sm border border-white/15
            text-white/80 transition-all hover:bg-black/90"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
}
