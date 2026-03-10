"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CaptionViewerSettings } from "./captionViewerSettings";

type Props = {
  text: string;
  settings: CaptionViewerSettings;
  placeholder?: string;
};

const getDisplayText = (text: string, placeholder: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return placeholder;
  // Keep sharing view simple: always show full accumulated text.
  // The upstream transcript appends new speech to the end.
  return trimmed;
};

const getAlignItems = (
  settings: CaptionViewerSettings
): React.CSSProperties["alignItems"] => {
  if (settings.horizontalAlignment === "left") return "flex-start";
  if (settings.horizontalAlignment === "right") return "flex-end";
  if (settings.horizontalAlignment === "full") return "stretch";
  return "center";
};

const getBlockWidthStyles = (
  settings: CaptionViewerSettings
): React.CSSProperties => {
  if (settings.horizontalAlignment === "full") {
    return {
      width: "100%",
      maxWidth: "100%",
      marginLeft: 0,
      marginRight: 0,
    };
  }

  if (settings.horizontalAlignment === "left") {
    return {
      width: "fit-content",
      maxWidth: "86%",
      marginLeft: 0,
      marginRight: "auto",
    };
  }

  if (settings.horizontalAlignment === "right") {
    return {
      width: "fit-content",
      maxWidth: "86%",
      marginLeft: "auto",
      marginRight: 0,
    };
  }

  return {
    width: "fit-content",
    maxWidth: "86%",
    marginLeft: "auto",
    marginRight: "auto",
  };
};

const getTextAlign = (
  settings: CaptionViewerSettings,
  isMobile: boolean
): React.CSSProperties["textAlign"] => {
  if (settings.horizontalAlignment === "left") return "left";
  if (settings.horizontalAlignment === "right") return "left";
  if (settings.horizontalAlignment === "full") {
    return isMobile ? "left" : "justify";
  }
  return "center";
};

export default function CaptionViewerDisplay({
  text,
  settings,
  placeholder = "Waiting for captions…",
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const displayText = useMemo(
    () => getDisplayText(text, placeholder),
    [placeholder, text]
  );

  const lines = useMemo(() => {
    return displayText.split("\n");
  }, [displayText]);

  const effectiveLetterSpacing = useMemo(() => {
    if (!isMobile) return settings.letterSpacingEm;
    return Math.min(settings.letterSpacingEm, 0.06);
  }, [isMobile, settings.letterSpacingEm]);

  return (
    <div className="mx-auto w-full max-w-7xl" aria-live="polite">
      <div
        className="relative flex max-w-full flex-col justify-start px-3 py-3 sm:px-5 md:px-6"
        style={{
          ...getBlockWidthStyles(settings),
          color: settings.textColor,
          fontSize: `${settings.fontSizePx}px`,
          fontWeight: settings.fontWeight,
          lineHeight: settings.lineHeight,
          letterSpacing: `${effectiveLetterSpacing}em`,
          textAlign: getTextAlign(settings, isMobile),
          alignItems: getAlignItems(settings),
          contain: "layout style paint",
        }}
      >
        {lines.map((line, idx) => (
          <p
            key={`${idx}-${line}`}
            className="m-0 max-w-full break-words py-[2px] [text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]"
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
