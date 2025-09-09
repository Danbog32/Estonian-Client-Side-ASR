import React, { useState, useEffect, memo, useRef } from "react";
import { ScrollShadow, Tooltip, Button } from "@heroui/react";
import StartSpeakingPrompt from "./StartSpeakingPrompt";
import { Icons } from "./icons";
import { useSettings } from "../providers/SettingsContext";

// Lightweight punctuation/spacing cleanup for display (shared by components)
const formatDisplayText = (text: string): string => {
  if (!text) return text;
  let s = text;
  // Remove spaces before punctuation
  s = s.replace(/\s+([,\.!\?;:])/g, "$1");
  // Ensure a single space after punctuation if followed by a word/quote
  s = s.replace(/([,\.!\?;:])(?!\s|$)/g, "$1 ");
  // Collapse multiple spaces
  s = s.replace(/\s{2,}/g, " ");
  // Trim outer spaces
  s = s.trim();
  return s;
};

interface TranscriptBlock {
  id: string;
  text: string;
  isComplete: boolean;
  timestamp: string;
  translation?: {
    text: string;
    status: "pending" | "completed" | "error" | "partial";
    timestamp?: string;
    isPartial?: boolean;
  };
}

interface CaptionDisplayProps {
  textSize: number;
  lineHeight: number;
  loading: boolean;
}

interface TranscriptBlockComponentProps {
  block: TranscriptBlock;
  index: number;
  totalBlocks: number;
  textSize: number;
  lineHeight: number;
  onCopyText: (text: string, blockId: string) => void;
  copiedBlockId: string | null;
}

// Memoized TranscriptBlock component to prevent unnecessary re-renders
const TranscriptBlockComponent = memo<TranscriptBlockComponentProps>(
  ({
    block,
    index,
    totalBlocks,
    textSize,
    lineHeight,
    onCopyText,
    copiedBlockId,
  }) => {
    const { language } = useSettings() as { language: "en" | "et" };

    const translations = {
      en: {
        complete: "Complete",
        speaking: "Speaking...",
        copyText: "Copy text",
        copyTextTitle: "Copy text",
      },
      et: {
        complete: "Valmis",
        speaking: "Räägib...",
        copyText: "Kopeeri tekst",
        copyTextTitle: "Kopeeri tekst",
      },
    };

    const t = translations[language];

    return (
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${
            block.isComplete
              ? "bg-gray-800/50 border border-gray-700/50 rounded-lg p-2 sm:p-3 mb-2 sm:mb-4 shadow-sm"
              : "bg-blue-900/30 border border-blue-600/30 rounded-lg p-2 sm:p-3 mb-2"
          }
          ${index === totalBlocks - 1 ? "mb-0" : ""}
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <div
            className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${
              block.isComplete
                ? "bg-green-900/50 text-green-300 border border-green-700/50"
                : "bg-blue-900/50 text-blue-300 border border-blue-600/50"
            }
          `}
          >
            {block.isComplete ? (
              <>
                <Icons.check className="w-3 h-3 mr-1" />
                {t.complete}
              </>
            ) : (
              <>
                <Icons.loader className="w-3 h-3 mr-1 animate-spin" />
                {t.speaking}
              </>
            )}
          </div>
          <time className="text-xs text-gray-400">
            {new Date(block.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </time>
        </div>
        <div className="relative">
          <p
            className={`
            text-white pr-8 sm:pr-12 leading-relaxed
            ${!block.isComplete ? "text-blue-100" : ""}
          `}
            style={{
              fontSize: `${textSize}rem`,
              lineHeight: lineHeight,
            }}
          >
            {formatDisplayText(block.text)}
          </p>

          {/* Copy button in bottom right corner */}
          <Tooltip content={t.copyText} showArrow={true}>
            <Button
              onPress={() => onCopyText(block.text, block.id)}
              size="sm"
              isIconOnly
              className={`
                absolute bottom-1 right-1 p-1 sm:p-1.5 rounded-md transition-all duration-200 min-w-8 min-h-8 sm:min-w-auto sm:min-h-auto
                ${
                  copiedBlockId === block.id
                    ? "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white opacity-70 hover:opacity-100"
                    : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white opacity-70 hover:opacity-100"
                }
              `}
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
  }
);

TranscriptBlockComponent.displayName = "TranscriptBlockComponent";

const CaptionDisplay: React.FC<CaptionDisplayProps> = memo(
  ({ textSize, lineHeight, loading }): JSX.Element => {
    const [transcriptBlocks, setTranscriptBlocks] = useState<TranscriptBlock[]>(
      []
    );
    const [translationBlocks, setTranslationBlocks] = useState<
      TranscriptBlock[]
    >([]);
    const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
    const [isVerticalLayout, setIsVerticalLayout] = useState(false);
    // Auto-scroll state
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [copiedAll, setCopiedAll] = useState(false);

    // Refs for scroll containers
    const estonianScrollRef = useRef<HTMLDivElement>(null);
    const translationScrollRef = useRef<HTMLDivElement>(null);
    const singleScrollRef = useRef<HTMLDivElement>(null);

    const { language, translationEnabled } = useSettings() as {
      language: "en" | "et";
      translationEnabled: boolean;
    };

    // Use ref to track processed translations to prevent duplicates
    const processedTranslations = useRef(new Set<string>());

    const translations = {
      en: {
        complete: "Complete",
        speaking: "Speaking...",
        copyText: "Copy text",
        copyTextTitle: "Copy text",
        estonian: "Estonian",
        english: "English Translation",
        switchLayout: "Switch to vertical layout",
        switchToHorizontal: "Switch to horizontal layout",
        scrollToBottom: "Scroll to bottom",
        copyAll: "Copy all",
        copied: "Copied",
      },
      et: {
        complete: "Valmis",
        speaking: "Räägib...",
        copyText: "Kopeeri tekst",
        copyTextTitle: "Kopeeri tekst",
        estonian: "Eesti keel",
        english: "Inglise tõlge",
        switchLayout: "Lülitu vertikaalsele paigutusele",
        switchToHorizontal: "Lülitu horisontaalsele paigutusele",
        scrollToBottom: "Keri alla",
        copyAll: "Kopeeri kõik",
        copied: "Kopeeritud",
      },
    };

    const t = translations[language];

    // Function to check if a scroll container is at the bottom
    const isScrolledToBottom = (element: HTMLDivElement | null): boolean => {
      if (!element) return true;
      // Calculate threshold based on text size and line height
      // Use 1.5 lines of text as the threshold for "close enough"
      const threshold = Math.max(200, textSize * lineHeight * 100 * 1.5); // 24px is base font size
      return (
        element.scrollHeight - element.clientHeight - element.scrollTop <=
        threshold
      );
    };

    // Function to scroll to bottom
    const scrollToBottom = (element: HTMLDivElement | null) => {
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    };

    // Function to handle scroll events and update auto-scroll state
    const handleScroll = (element: HTMLDivElement | null) => {
      if (!element) return;

      const atBottom = isScrolledToBottom(element);

      // Show/hide scroll button
      setShowScrollButton(!atBottom);

      // Re-enable auto-scroll if user scrolled to bottom
      if (atBottom && !isAutoScrollEnabled) {
        setIsAutoScrollEnabled(true);
      }
      // Disable auto-scroll if user scrolled up
      else if (!atBottom && isAutoScrollEnabled) {
        setIsAutoScrollEnabled(false);
      }
    };

    // Check for mobile viewport and auto-switch to vertical layout
    useEffect(() => {
      const checkViewport = () => {
        const isMobile = window.innerWidth < 768; // md breakpoint
        if (isMobile && !isVerticalLayout) {
          setIsVerticalLayout(true);
        }
      };

      checkViewport();
      window.addEventListener("resize", checkViewport);
      return () => window.removeEventListener("resize", checkViewport);
    }, [isVerticalLayout]);

    // Auto-scroll effect for new content
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
    ]);

    // Scroll to bottom button handler
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
        // console.log(
        //   "🔥 CaptionDisplay received translationUpdate event:",
        //   event.detail
        // );
        const { originalText, translatedText } = event.detail;

        if (translatedText) {
          const newText = String(translatedText).trim();

          setTranslationBlocks((prevBlocks) => {
            const nowIso = new Date().toISOString();
            // Ensure we keep only a single accumulated block
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

            // Merge strategy:
            // - If newText is a superset of currentText → replace with newText
            // - If newText is already contained → no-op
            // - Otherwise append with a space
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
          console.warn("⚠️ No translatedText in event:", event.detail);
        }
      };

      const handleTranslationClear = () => {
        console.log("🧹 Clearing translation blocks");
        setTranslationBlocks([]);
        // Clear the processed translations set
        processedTranslations.current.clear();
      };

      // Listen for events from the ASR script
      window.addEventListener(
        "transcriptUpdate",
        handleTranscriptUpdate as EventListener
      );
      window.addEventListener(
        "translationUpdate",
        handleTranslationUpdate as EventListener
      );
      window.addEventListener(
        "translationClear",
        handleTranslationClear as EventListener
      );

      return () => {
        window.removeEventListener(
          "transcriptUpdate",
          handleTranscriptUpdate as EventListener
        );
        window.removeEventListener(
          "translationUpdate",
          handleTranslationUpdate as EventListener
        );
        window.removeEventListener(
          "translationClear",
          handleTranslationClear as EventListener
        );
      };
    }, []);

    const handleCopyText = async (text: string, blockId: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedBlockId(blockId);

        // Reset the copied state after 1.5 seconds
        setTimeout(() => {
          setCopiedBlockId(null);
        }, 1500);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    };

    // const toggleLayout = () => {
    //   setIsVerticalLayout(!isVerticalLayout);
    // };

    // const handleCopyAll = async () => {
    //   try {
    //     const allText = transcriptBlocks.map((b) => b.text).join(" \n");
    //     await navigator.clipboard.writeText(allText || "");
    //     setCopiedAll(true);
    //     setTimeout(() => setCopiedAll(false), 1500);
    //   } catch (e) {
    //     console.error("Failed to copy all text", e);
    //   }
    // };

    return (
      <div className="flex flex-col h-full w-full justify-end">
        {/* Hidden element for backward compatibility with ASR script */}
        <div id="transcriptText" className="hidden"></div>

        {/* Top toolbar */}
        {/* <div className="flex justify-end p-2 border-b border-gray-700/50">
          <Tooltip content={copiedAll ? t.copied : t.copyAll} showArrow={true}>
            <Button
              onPress={handleCopyAll}
              size="sm"
              className="text-gray-300 hover:text-white bg-gray-700/40 hover:bg-gray-700/60 border border-gray-600/50"
            >
              {copiedAll ? (
                <div className="flex items-center gap-1">
                  <Icons.check className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.copied}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Icons.copy className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.copyAll}</span>
                </div>
              )}
            </Button>
          </Tooltip>
        </div> */}

        {translationEnabled ? (
          <div className="flex flex-col h-full">
            {/* Layout toggle button for larger screens */}
            {/* <div className="hidden md:flex justify-end p-2 border-b border-gray-700/50">
              <Tooltip
                content={
                  isVerticalLayout ? t.switchToHorizontal : t.switchLayout
                }
                showArrow={true}
              >
                <Button
                  onPress={toggleLayout}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  {isVerticalLayout ? (
                    <Icons.panelLeftClose className="w-4 h-4" />
                  ) : (
                    <Icons.panelTop className="w-4 h-4" />
                  )}
                </Button>
              </Tooltip>
            </div> */}

            {/* Responsive layout container */}
            <div
              className={`flex h-full ${isVerticalLayout ? "flex-col" : "md:flex-row flex-col"} gap-1 md:gap-2`}
            >
              {/* Estonian side */}
              <div
                className={`${isVerticalLayout ? "flex-none h-1/2" : "flex-1"} flex flex-col`}
              >
                <div className="flex items-center gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-800/50 border-b border-gray-700/50">
                  <Icons.languages className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                  <h3 className="text-xs sm:text-sm font-medium text-white">
                    {t.estonian}
                  </h3>
                </div>
                <ScrollShadow
                  className="text-white scroll-smooth overflow-auto p-2 sm:p-4 space-y-2 sm:space-y-3 flex-1"
                  style={{
                    fontSize: `${Math.min(textSize, 1.2)}rem`,
                    lineHeight: lineHeight,
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
                      textSize={textSize}
                      lineHeight={lineHeight}
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
                <div className="flex items-center gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-800/50 border-b border-gray-700/50">
                  <Icons.languages className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <h3 className="text-xs sm:text-sm font-medium text-white">
                    {t.english}
                  </h3>
                </div>
                <ScrollShadow
                  className="text-white scroll-smooth overflow-auto p-2 sm:p-4 space-y-2 sm:space-y-3 flex-1"
                  style={{
                    fontSize: `${textSize}rem`,
                    lineHeight: lineHeight,
                  }}
                  onScroll={() => handleScroll(translationScrollRef.current)}
                  ref={translationScrollRef}
                >
                  {!loading &&
                    translationBlocks.length === 0 &&
                    transcriptBlocks.length !== 0 && (
                      <div className="text-center text-gray-400 py-4 sm:py-8">
                        <Icons.languages className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm px-2">
                          {language === "en"
                            ? "Translations will appear here when you start speaking in Estonian"
                            : "Tõlked ilmuvad siia, kui hakkate eesti keeles rääkima"}
                        </p>
                      </div>
                    )}
                  {translationBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="bg-green-900/20 border border-green-700/30 rounded-lg p-2 sm:p-3 mb-2 sm:mb-4 shadow-sm transition-all duration-300 ease-in-out"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <time className="text-xs text-gray-400">
                          {new Date(block.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </time>
                      </div>
                      <div className="relative">
                        <p
                          className="text-green-100 pr-8 sm:pr-12 leading-relaxed"
                          style={{
                            fontSize: `${textSize}rem`,
                            lineHeight: lineHeight,
                          }}
                        >
                          {formatDisplayText(block.text)}
                        </p>
                        <Tooltip content={t.copyText} showArrow={true}>
                          <Button
                            onPress={() => handleCopyText(block.text, block.id)}
                            size="sm"
                            isIconOnly
                            className={`
                               absolute bottom-1 right-1 p-1 sm:p-1.5 rounded-md transition-all duration-200 min-w-8 min-h-8 sm:min-w-auto sm:min-h-auto
                               ${
                                 copiedBlockId === block.id
                                   ? "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white opacity-70 hover:opacity-100"
                                   : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white opacity-70 hover:opacity-100"
                               }
                             `}
                            title={t.copyText}
                          >
                            {copiedBlockId === block.id ? (
                              <Icons.check className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <Icons.copy className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </Button>
                        </Tooltip>
                        {/* Show original text reference if available */}
                        {/* {block.translation?.text && (
                          <div className="mt-2 pt-2 border-t border-green-800/30">
                            <p className="text-xs text-gray-400 italic">
                              {language === "en" ? "Original: " : "Algne: "}
                              {block.translation.text.length > 80
                                ? block.translation.text.substring(0, 80) +
                                  "..."
                                : block.translation.text}
                            </p>
                          </div>
                        )} */}
                      </div>
                    </div>
                  ))}
                </ScrollShadow>
              </div>
            </div>
          </div>
        ) : (
          /* Single-screen layout for normal mode */
          <ScrollShadow
            className="text-white scroll-smooth overflow-auto p-4 space-y-3"
            style={{ fontSize: `${textSize}rem`, lineHeight: lineHeight }}
            onScroll={() => handleScroll(singleScrollRef.current)}
            ref={singleScrollRef}
          >
            {!loading && transcriptBlocks.length === 0 && (
              <StartSpeakingPrompt />
            )}

            {/* Render transcript blocks using memoized component */}
            {transcriptBlocks.map((block, index) => (
              <TranscriptBlockComponent
                key={block.id}
                block={block}
                index={index}
                totalBlocks={transcriptBlocks.length}
                textSize={textSize}
                lineHeight={lineHeight}
                onCopyText={handleCopyText}
                copiedBlockId={copiedBlockId}
              />
            ))}
          </ScrollShadow>
        )}

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Tooltip content={t.scrollToBottom} showArrow={true}>
            <Button
              onPress={handleScrollToBottomClick}
              size="sm"
              variant="ghost"
              className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10 bg-gray-800/80 text-gray-300  border border-gray-600/50 rounded-full p-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
              isIconOnly
            >
              <Icons.arrowDown className="w-5 h-5 flex-shrink-0" />
            </Button>
          </Tooltip>
        )}
      </div>
    );
  }
);

CaptionDisplay.displayName = "CaptionDisplay";

export default CaptionDisplay;
