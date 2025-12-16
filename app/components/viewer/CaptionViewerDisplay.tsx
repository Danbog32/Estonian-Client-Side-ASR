"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import type { CaptionViewerSettings } from "./captionViewerSettings";
import { ScrollShadow } from "@heroui/react";
import { useAutoScroll } from "@/app/hooks/useAutoScroll";

type Props = {
  text: string;
  settings: CaptionViewerSettings;
  placeholder?: string;
};

const splitIntoLines = (text: string): string[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split("\n").map((line) => line.trimEnd());
};

const getParagraphs = (
  text: string,
  settings: CaptionViewerSettings,
  placeholder: string
): string[] => {
  const lines = splitIntoLines(text);
  if (lines.length === 0) return [placeholder];

  if (settings.viewMode === "captions") {
    if (lines.length <= 3) return lines;
    return lines.slice(-3);
  }

  return lines;
};

const getContainerClassName = (settings: CaptionViewerSettings): string => {
  if (settings.horizontalAlignment === "full") return "w-full";

  const alignClass =
    settings.horizontalAlignment === "left"
      ? "mr-auto"
      : settings.horizontalAlignment === "right"
        ? "ml-auto"
        : "mx-auto";

  return `w-full max-w-5xl ${alignClass}`;
};

const getTextAlign = (
  settings: CaptionViewerSettings
): React.CSSProperties["textAlign"] => {
  if (settings.horizontalAlignment === "left") return "left";
  if (settings.horizontalAlignment === "right") return "right";
  return "center";
};

export default function CaptionViewerDisplay({
  text,
  settings,
  placeholder = "Waiting for captions…",
}: Props) {
  const paragraphs = useMemo(
    () => getParagraphs(text, settings, placeholder),
    [placeholder, settings, text]
  );

  const containerClassName = useMemo(
    () => getContainerClassName(settings),
    [settings]
  );

  const viewerDisplay = useMemo(() => {
    return paragraphs.join(" ").trim();
  }, [paragraphs]);

  const {
    scrollRef: viewerScrollRef,
    isScrolledUp: viewerIsScrolledUp,
    scrollToBottom: viewerScrollToBottom,
  } = useAutoScroll<HTMLDivElement>({
    content: viewerDisplay,
    threshold: 400,
    buttonThreshold: 200,
    enabled: true,
  });

  return (
    <ScrollShadow
      className={containerClassName}
      aria-live="polite"
      style={{
        color: settings.textColor,
        fontSize: `${settings.fontSizePx}px`,
        fontWeight: settings.fontWeight,
        lineHeight: settings.lineHeight,
        letterSpacing: `${settings.letterSpacingEm}em`,
        // textAlign: getTextAlign(settings),
      }}
      ref={viewerScrollRef}
    >
      {paragraphs.map((paragraph, idx) => (
        <p
          key={`${idx}-${paragraph}`}
          className={idx === paragraphs.length - 1 ? "m-0" : "m-0 mb-[0.6em]"}
        >
          {paragraph}
        </p>
      ))}

      {viewerIsScrolledUp && (
        <button
          onClick={viewerScrollToBottom}
          className="absolute cursor-pointer bottom-20 md:bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center justify-center w-12 h-12 md:w-10 md:h-10 rounded-full bg-emerald-500/90 hover:bg-emerald-400 active:bg-emerald-500 backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Scroll to bottom"
        >
          <svg
            className="w-6 h-6 md:w-5 md:h-5 text-black"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </button>
      )}
    </ScrollShadow>
  );
}
