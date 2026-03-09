import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import { ScrollShadow, Tooltip, Button } from "@heroui/react";
import StartSpeakingPrompt from "./StartSpeakingPrompt";
import { Icons } from "./icons";
import { useSettings } from "../providers/SettingsContext";
import type { CaptionViewerSettings } from "./viewer/captionViewerSettings";

const formatDisplayText = (text: string): string => {
  if (!text) return text;
  let s = text;
  s = s.replace(/\s+([,\.!\?;:])/g, "$1");
  s = s.replace(/([,\.!\?;:])(?!\s|$)/g, "$1 ");
  s = s.replace(/\s{2,}/g, " ");
  s = s.trim();
  return s;
};

const withAlpha = (hex: string, alpha: number) => {
  const raw = hex.replace("#", "").trim();
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw;
  const int = Number.parseInt(normalized, 16);
  if (Number.isNaN(int)) return `rgba(255,255,255,${alpha})`;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

interface TranscriptBlock {
  id: string;
  text: string;
  isComplete: boolean;
  timestamp: string;
  previewSuffix?: string;
  translation?: {
    text: string;
    status: "pending" | "completed" | "error" | "partial";
    timestamp?: string;
    isPartial?: boolean;
  };
}

interface CaptionDisplayProps {
  settings: CaptionViewerSettings;
  loading: boolean;
}

interface TranscriptBlockComponentProps {
  block: TranscriptBlock;
  index: number;
  totalBlocks: number;
  settings: CaptionViewerSettings;
  onCopyText: (text: string, blockId: string) => void;
  copiedBlockId: string | null;
}

const TranscriptBlockComponent = memo<TranscriptBlockComponentProps>(
  ({ block, index, totalBlocks, settings, onCopyText, copiedBlockId }) => {
    const { language } = useSettings();

    const translations = {
      en: {
        copyText: "Copy text",
        copyTextTitle: "Copy text",
      },
      et: {
        copyText: "Kopeeri tekst",
        copyTextTitle: "Kopeeri tekst",
      },
    };

    const t = translations[language];

    const textStyle: React.CSSProperties = {
      fontSize: `${settings.fontSizePx}px`,
      lineHeight: settings.lineHeight,
      fontWeight: settings.fontWeight,
      letterSpacing: `${settings.letterSpacingEm}em`,
      color: settings.textColor,
    };

    const renderedText = `${block.text}${block.previewSuffix || ""}`;

    return (
      <div
        className={`transition-all duration-300 ease-in-out rounded-lg p-2 sm:p-3 ${index === totalBlocks - 1 ? "mb-0" : "mb-2 sm:mb-4"}`}
        style={{
          backgroundColor: block.isComplete
            ? withAlpha(settings.textColor, 0.06)
            : withAlpha(settings.textColor, 0.1),
          borderWidth: 1,
          borderColor: block.isComplete
            ? withAlpha(settings.textColor, 0.1)
            : withAlpha(settings.textColor, 0.2),
        }}
      >
        <div className="relative">
          <p
            className="pr-8 sm:pr-12 leading-relaxed break-all sm:break-normal"
            style={{
              ...textStyle,
              opacity: block.isComplete ? 1 : 0.85,
            }}
          >
            {formatDisplayText(renderedText)}
          </p>

          <Tooltip content={t.copyText} showArrow={true}>
            <Button
              onPress={() => onCopyText(renderedText, block.id)}
              size="sm"
              isIconOnly
              className="absolute bottom-1 right-1 p-1 sm:p-1.5 rounded-md transition-all duration-200 min-w-8 min-h-8 sm:min-w-auto sm:min-h-auto opacity-70 hover:opacity-100"
              style={{
                backgroundColor: withAlpha(settings.textColor, 0.1),
                color: withAlpha(settings.textColor, 0.7),
              }}
              title={t.copyTextTitle}
            >
              {copiedBlockId === block.id ? (
                <Icons.check className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Icons.copy className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  },
);

TranscriptBlockComponent.displayName = "TranscriptBlockComponent";

const CaptionDisplay: React.FC<CaptionDisplayProps> = memo(
  ({ settings, loading }) => {
    const [transcriptBlocks, setTranscriptBlocks] = useState<TranscriptBlock[]>(
      [],
    );
    const [translationBlocks, setTranslationBlocks] = useState<
      TranscriptBlock[]
    >([]);
    const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
    const [isVerticalLayout, setIsVerticalLayout] = useState(false);
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const estonianScrollRef = useRef<HTMLDivElement>(null);
    const translationScrollRef = useRef<HTMLDivElement>(null);
    const singleScrollRef = useRef<HTMLDivElement>(null);

    const { language, translationEnabled } = useSettings();

    const processedTranslations = useRef(new Set<string>());

    const translations = {
      en: {
        estonian: "Estonian",
        english: "English Translation",
        scrollToBottom: "Scroll to bottom",
      },
      et: {
        estonian: "Eesti keel",
        english: "Inglise tõlge",
        scrollToBottom: "Keri alla",
      },
    };

    const t = translations[language];

    const alignmentClass =
      settings.horizontalAlignment === "left"
        ? "text-left"
        : settings.horizontalAlignment === "right"
          ? "text-right"
          : settings.horizontalAlignment === "center"
            ? "text-center"
            : "";

    const isScrolledToBottom = useCallback(
      (element: HTMLDivElement | null): boolean => {
        if (!element) return true;
        const threshold = Math.max(
          200,
          settings.fontSizePx * settings.lineHeight * 1.5,
        );
        return (
          element.scrollHeight - element.clientHeight - element.scrollTop <=
          threshold
        );
      },
      [settings.fontSizePx, settings.lineHeight],
    );

    const scrollToBottom = (element: HTMLDivElement | null) => {
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    };

    const handleScroll = (element: HTMLDivElement | null) => {
      if (!element) return;

      const atBottom = isScrolledToBottom(element);
      setShowScrollButton(!atBottom);

      if (atBottom && !isAutoScrollEnabled) {
        setIsAutoScrollEnabled(true);
      } else if (!atBottom && isAutoScrollEnabled) {
        setIsAutoScrollEnabled(false);
      }
    };

    useEffect(() => {
      const checkViewport = () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile && !isVerticalLayout) {
          setIsVerticalLayout(true);
        }
      };

      checkViewport();
      window.addEventListener("resize", checkViewport);
      return () => window.removeEventListener("resize", checkViewport);
    }, [isVerticalLayout]);

    useEffect(() => {
      if (!isAutoScrollEnabled) return;

      const scrollContainers = translationEnabled
        ? [estonianScrollRef.current, translationScrollRef.current]
        : [singleScrollRef.current];

      scrollContainers.forEach((container) => {
        if (container && isScrolledToBottom(container)) {
          scrollToBottom(container);
        }
      });
    }, [
      transcriptBlocks,
      translationBlocks,
      isAutoScrollEnabled,
      translationEnabled,
      isScrolledToBottom,
    ]);

    const handleScrollToBottomClick = () => {
      const scrollContainers = translationEnabled
        ? [estonianScrollRef.current, translationScrollRef.current]
        : [singleScrollRef.current];

      scrollContainers.forEach((container) => {
        scrollToBottom(container);
      });

      setIsAutoScrollEnabled(true);
      setShowScrollButton(false);
    };

    useEffect(() => {
      const handleTranscriptUpdate = (event: CustomEvent) => {
        const { blocks } = event.detail;
        setTranscriptBlocks(blocks || []);
      };

      const handleTranslationUpdate = (event: CustomEvent) => {
        const { originalText, translatedText } = event.detail;

        if (translatedText) {
          const newText = String(translatedText).trim();

          setTranslationBlocks((prevBlocks) => {
            const nowIso = new Date().toISOString();
            const existingBlock = prevBlocks[0];

            if (!existingBlock) {
              const singleBlock: TranscriptBlock = {
                id: "translation-accumulated",
                text: newText,
                isComplete: true,
                timestamp: nowIso,
                translation: {
                  text: originalText || "",
                  status: "completed",
                  timestamp: nowIso,
                  isPartial: false,
                },
              };
              return [singleBlock];
            }

            const currentText = existingBlock.text || "";

            let merged = currentText;
            if (newText.startsWith(currentText)) {
              merged = newText;
            } else if (
              currentText.startsWith(newText) ||
              currentText.includes(newText)
            ) {
              merged = currentText;
            } else {
              merged = (
                currentText +
                (currentText.endsWith(" ") ? "" : " ") +
                newText
              ).trim();
            }

            if (merged === currentText) {
              return [existingBlock];
            }

            const updatedBlock: TranscriptBlock = {
              ...existingBlock,
              text: merged,
              isComplete: true,
              timestamp: nowIso,
              translation: {
                ...(existingBlock.translation || {}),
                text: originalText || existingBlock.translation?.text || "",
                status: "completed",
                timestamp: nowIso,
                isPartial: false,
              },
            };

            return [updatedBlock];
          });
        } else {
          console.warn("No translatedText in event:", event.detail);
        }
      };

      const handleTranslationClear = () => {
        setTranslationBlocks([]);
        processedTranslations.current.clear();
      };

      window.addEventListener(
        "transcriptUpdate",
        handleTranscriptUpdate as EventListener,
      );
      window.addEventListener(
        "translationUpdate",
        handleTranslationUpdate as EventListener,
      );
      window.addEventListener(
        "translationClear",
        handleTranslationClear as EventListener,
      );

      return () => {
        window.removeEventListener(
          "transcriptUpdate",
          handleTranscriptUpdate as EventListener,
        );
        window.removeEventListener(
          "translationUpdate",
          handleTranslationUpdate as EventListener,
        );
        window.removeEventListener(
          "translationClear",
          handleTranslationClear as EventListener,
        );
      };
    }, []);

    const handleCopyText = async (text: string, blockId: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedBlockId(blockId);
        setTimeout(() => {
          setCopiedBlockId(null);
        }, 1500);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    };

    const textStyle: React.CSSProperties = {
      fontSize: `${settings.fontSizePx}px`,
      lineHeight: settings.lineHeight,
      fontWeight: settings.fontWeight,
      letterSpacing: `${settings.letterSpacingEm}em`,
      color: settings.textColor,
    };

    const sectionHeaderStyle: React.CSSProperties = {
      backgroundColor: withAlpha(settings.textColor, 0.05),
      borderColor: withAlpha(settings.textColor, 0.1),
    };

    return (
      <div
        className={`flex flex-col h-full w-full justify-end ${alignmentClass}`}
      >
        <div id="transcriptText" className="hidden"></div>

        {translationEnabled ? (
          <div className="flex flex-col h-full">
            <div
              className={`flex h-full ${isVerticalLayout ? "flex-col" : "md:flex-row flex-col"} gap-1 md:gap-2`}
            >
              {/* Estonian side */}
              <div
                className={`${isVerticalLayout ? "flex-none h-1/2" : "flex-1"} flex flex-col`}
              >
                <div
                  className="flex items-center gap-2 px-2 sm:px-4 py-1.5 sm:py-2 border-b"
                  style={sectionHeaderStyle}
                >
                  <Icons.languages className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                  <h3
                    className="text-xs sm:text-sm font-medium"
                    style={{ color: settings.textColor }}
                  >
                    {t.estonian}
                  </h3>
                </div>
                <ScrollShadow
                  className="scroll-smooth overflow-auto p-2 sm:p-4 space-y-2 sm:space-y-3 flex-1"
                  style={{
                    ...textStyle,
                    fontSize: `${Math.min(settings.fontSizePx, 20)}px`,
                  }}
                  onScroll={() => handleScroll(estonianScrollRef.current)}
                  ref={estonianScrollRef}
                >
                  {!loading && transcriptBlocks.length === 0 && (
                    <StartSpeakingPrompt />
                  )}
                  {transcriptBlocks.map((block, index) => (
                    <TranscriptBlockComponent
                      key={block.id}
                      block={block}
                      index={index}
                      totalBlocks={transcriptBlocks.length}
                      settings={settings}
                      onCopyText={handleCopyText}
                      copiedBlockId={copiedBlockId}
                    />
                  ))}
                </ScrollShadow>
              </div>

              {/* Translation side */}
              <div
                className={`${isVerticalLayout ? "flex-none h-1/2" : "flex-1"} flex flex-col`}
              >
                <div
                  className="flex items-center gap-2 px-2 sm:px-4 py-1.5 sm:py-2 border-b"
                  style={sectionHeaderStyle}
                >
                  <Icons.languages className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <h3
                    className="text-xs sm:text-sm font-medium"
                    style={{ color: settings.textColor }}
                  >
                    {t.english}
                  </h3>
                </div>
                <ScrollShadow
                  className="scroll-smooth overflow-auto p-2 sm:p-4 space-y-2 sm:space-y-3 flex-1"
                  style={textStyle}
                  onScroll={() => handleScroll(translationScrollRef.current)}
                  ref={translationScrollRef}
                >
                  {!loading &&
                    translationBlocks.length === 0 &&
                    transcriptBlocks.length !== 0 && (
                      <div className="text-center py-4 sm:py-8 opacity-50">
                        <Icons.languages className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm px-2">
                          {language === "en"
                            ? "Translations will appear here when you start speaking in Estonian"
                            : "Tõlked ilmuvad siia, kui hakkate eesti keeles rääkima"}
                        </p>
                      </div>
                    )}
                  {translationBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="rounded-lg p-2 sm:p-3 mb-2 sm:mb-4 shadow-sm transition-all duration-300 ease-in-out"
                      style={{
                        backgroundColor: withAlpha(settings.textColor, 0.08),
                        borderWidth: 1,
                        borderColor: withAlpha(settings.textColor, 0.15),
                      }}
                    >
                      <div className="relative">
                        <p
                          className="pr-8 sm:pr-12 leading-relaxed"
                          style={textStyle}
                        >
                          {formatDisplayText(block.text)}
                        </p>
                        <Tooltip
                          content={
                            language === "en" ? "Copy text" : "Kopeeri tekst"
                          }
                          showArrow={true}
                        >
                          <Button
                            onPress={() =>
                              handleCopyText(block.text, block.id)
                            }
                            size="sm"
                            isIconOnly
                            className="absolute bottom-1 right-1 p-1 sm:p-1.5 rounded-md transition-all duration-200 min-w-8 min-h-8 sm:min-w-auto sm:min-h-auto opacity-70 hover:opacity-100"
                            style={{
                              backgroundColor: withAlpha(
                                settings.textColor,
                                0.1,
                              ),
                              color: withAlpha(settings.textColor, 0.7),
                            }}
                            title={
                              language === "en" ? "Copy text" : "Kopeeri tekst"
                            }
                          >
                            {copiedBlockId === block.id ? (
                              <Icons.check className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <Icons.copy className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </ScrollShadow>
              </div>
            </div>
          </div>
        ) : (
          <ScrollShadow
            className="scroll-smooth overflow-auto p-4 space-y-3"
            style={textStyle}
            onScroll={() => handleScroll(singleScrollRef.current)}
            ref={singleScrollRef}
          >
            {!loading && transcriptBlocks.length === 0 && (
              <StartSpeakingPrompt />
            )}

            {transcriptBlocks.map((block, index) => (
              <TranscriptBlockComponent
                key={block.id}
                block={block}
                index={index}
                totalBlocks={transcriptBlocks.length}
                settings={settings}
                onCopyText={handleCopyText}
                copiedBlockId={copiedBlockId}
              />
            ))}
          </ScrollShadow>
        )}

        {showScrollButton && (
          <Tooltip content={t.scrollToBottom} showArrow={true}>
            <Button
              onPress={handleScrollToBottomClick}
              size="sm"
              variant="ghost"
              className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10 rounded-full p-2 min-w-[40px] min-h-[40px] flex items-center justify-center backdrop-blur-xl"
              style={{
                backgroundColor: withAlpha(settings.backgroundColor, 0.85),
                color: withAlpha(settings.textColor, 0.9),
                borderWidth: 1,
                borderColor: withAlpha(settings.textColor, 0.2),
              }}
              isIconOnly
            >
              <Icons.arrowDown className="w-5 h-5 flex-shrink-0" />
            </Button>
          </Tooltip>
        )}
      </div>
    );
  },
);

CaptionDisplay.displayName = "CaptionDisplay";

export default CaptionDisplay;
