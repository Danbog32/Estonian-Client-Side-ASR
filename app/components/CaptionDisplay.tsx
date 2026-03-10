"use client";

import { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
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
  onScrollStateChange?: (isScrolledUp: boolean) => void;
  scrollToBottomRef?: React.MutableRefObject<(() => void) | null>;
}

export default function CaptionDisplay({
  loading,
  onScrollStateChange,
  scrollToBottomRef,
}: CaptionDisplayProps) {
  const { textSize, lineHeight, textColor } = useSettings();

  const [transcriptBlocks, setTranscriptBlocks] = useState<TranscriptBlock[]>(
    [],
  );
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const lastBlockText =
    transcriptBlocks.length > 0
      ? transcriptBlocks[transcriptBlocks.length - 1]?.text
      : "";
  const lastBlockPreviewSuffix =
    transcriptBlocks.length > 0
      ? transcriptBlocks[transcriptBlocks.length - 1]?.previewSuffix || ""
      : "";
  const autoScrollContentKey = `${transcriptBlocks.length}:${lastBlockText}:${lastBlockPreviewSuffix}`;

  const { scrollRef, isScrolledUp, scrollToBottom } =
    useAutoScroll<HTMLDivElement>({
      content: autoScrollContentKey,
      threshold: 100,
      buttonThreshold: 200,
    });

  if (scrollToBottomRef) {
    scrollToBottomRef.current = scrollToBottom;
  }

  useEffect(() => {
    onScrollStateChange?.(isScrolledUp);
  }, [isScrolledUp, onScrollStateChange]);

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
    <div className="relative flex min-h-0 w-full flex-1 flex-col" role="main">
      <div id="transcriptText" className="hidden" />

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth px-4 pt-16 pb-28 sm:px-6"
        style={{ color: textColor }}
        aria-live="polite"
      >
        {!loading && transcriptBlocks.length === 0 && <StartSpeakingPrompt />}

        <div className="max-w-6xl mx-auto space-y-4">
          {transcriptBlocks.map((block, index) => {
            const isLatest = index === transcriptBlocks.length - 1;
            const text = formatDisplayText(
              `${block.text}${block.previewSuffix || ""}`,
            );
            return (
              <div key={block.id} className="group relative ">
                <p
                  className={`pr-10 break-words select-text transition-opacity ${
                    !isLatest ? "opacity-60" : ""
                  }`}
                  style={{ fontSize: `${textSize}rem`, lineHeight }}
                >
                  {text}
                </p>
                <button
                  onClick={() => handleCopyText(text, block.id)}
                  className="absolute top-1/2 -translate-y-1/2 right-0 w-8 h-8 grid place-items-center rounded-md
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

    </div>
  );
}
