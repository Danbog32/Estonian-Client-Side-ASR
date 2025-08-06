import React, { useState, useEffect, memo, useRef } from "react";
import { ScrollShadow, Tooltip, Button } from "@heroui/react";
import StartSpeakingPrompt from "./StartSpeakingPrompt";
import { Icons } from "./icons";
import { useSettings } from "./SettingsContext";

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

interface TranslationBlockComponentProps {
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
              ? "bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 mb-4 shadow-sm"
              : "bg-blue-900/30 border border-blue-600/30 rounded-lg p-3 mb-2"
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
            text-white pr-12 leading-relaxed
            ${!block.isComplete ? "text-blue-100" : ""}
          `}
            style={{
              fontSize: `${textSize}rem`,
              lineHeight: lineHeight,
            }}
          >
            {block.text}
          </p>

          {/* Copy button in bottom right corner */}
          <Tooltip content={t.copyText} showArrow={true}>
            <Button
              onPress={() => onCopyText(block.text, block.id)}
              size="sm"
              isIconOnly
              className={`
                absolute bottom-1 right-1 p-1.5 rounded-md transition-all duration-200
                ${
                  copiedBlockId === block.id
                    ? "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white opacity-70 hover:opacity-100"
                    : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white opacity-70 hover:opacity-100"
                }
              `}
              title={t.copyTextTitle}
            >
              {copiedBlockId === block.id ? (
                <Icons.check className="w-4 h-4" />
              ) : (
                <Icons.copy className="w-4 h-4" />
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
      },
      et: {
        complete: "Valmis",
        speaking: "Räägib...",
        copyText: "Kopeeri tekst",
        copyTextTitle: "Kopeeri tekst",
        estonian: "Eesti keel",
        english: "Inglise tõlge",
      },
    };

    const t = translations[language];

    useEffect(() => {
      const handleTranscriptUpdate = (event: CustomEvent) => {
        const { blocks } = event.detail;
        setTranscriptBlocks(blocks || []);
      };

      const handleTranslationUpdate = (event: CustomEvent) => {
        console.log(
          "🔥 CaptionDisplay received translationUpdate event:",
          event.detail
        );
        const { originalText, translatedText } = event.detail;

        if (translatedText) {
          // Create a unique key for this translation to prevent duplicates
          const translationKey = `${originalText}_${translatedText}`.trim();

          // Check if we've already processed this exact translation
          if (processedTranslations.current.has(translationKey)) {
            console.log(
              "🔄 Skipping duplicate translation (already processed):",
              translatedText.substring(0, 50) + "..."
            );
            return;
          }

          // Mark this translation as processed
          processedTranslations.current.add(translationKey);

          setTranslationBlocks((prevBlocks) => {
            // Check for duplicate translations in existing blocks
            const isDuplicate = prevBlocks.some(
              (block) =>
                block.text.trim() === translatedText.trim() ||
                (block.translation?.text === originalText && originalText)
            );

            if (isDuplicate) {
              console.log(
                "🔄 Skipping duplicate translation (found in blocks):",
                translatedText.substring(0, 50) + "..."
              );
              return prevBlocks;
            }

            // Create a new translation block
            const newTranslationBlock: TranscriptBlock = {
              id: `translation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: translatedText,
              isComplete: true, // All translations are treated as complete
              timestamp: new Date().toISOString(),
              translation: {
                text: originalText || "", // Store original text as reference
                status: "completed",
                timestamp: new Date().toISOString(),
                isPartial: false,
              },
            };

            const updatedBlocks = [...prevBlocks, newTranslationBlock];
            console.log(
              "📝 Updated translation blocks count:",
              updatedBlocks.length
            );
            console.log(
              "🌐 Added new translation block to UI:",
              newTranslationBlock
            );
            return updatedBlocks;
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

    return (
      <div className="flex flex-col h-full w-full justify-end">
        {/* Hidden element for backward compatibility with ASR script */}
        <div id="transcriptText" className="hidden"></div>

        {translationEnabled ? (
          /* Split-screen layout for translation mode */
          <div className="flex h-full gap-2">
            {/* Estonian side */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
                <Icons.languages className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-medium text-white">{t.estonian}</h3>
              </div>
              <ScrollShadow
                className="text-white scroll-smooth overflow-auto p-4 space-y-3 flex-1"
                style={{ fontSize: `${textSize}rem`, lineHeight: lineHeight }}
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
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
                <Icons.languages className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-medium text-white">{t.english}</h3>
              </div>
              <ScrollShadow
                className="text-white scroll-smooth overflow-auto p-4 space-y-3 flex-1"
                style={{ fontSize: `${textSize}rem`, lineHeight: lineHeight }}
              >
                {!loading &&
                  translationBlocks.length === 0 &&
                  transcriptBlocks.length !== 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <Icons.languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {language === "en"
                          ? "Translations will appear here when you start speaking in Estonian"
                          : "Tõlked ilmuvad siia, kui hakkate eesti keeles rääkima"}
                      </p>
                    </div>
                  )}
                {translationBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mb-4 shadow-sm transition-all duration-300 ease-in-out"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700/50">
                        <Icons.check className="w-3 h-3 mr-1" />
                        {t.english}
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
                        className="text-green-100 pr-12 leading-relaxed"
                        style={{
                          fontSize: `${textSize}rem`,
                          lineHeight: lineHeight,
                        }}
                      >
                        {block.text}
                      </p>
                      <Tooltip content={t.copyText} showArrow={true}>
                        <Button
                          onPress={() => handleCopyText(block.text, block.id)}
                          size="sm"
                          isIconOnly
                          className={`
                             absolute bottom-1 right-1 p-1.5 rounded-md transition-all duration-200
                             ${
                               copiedBlockId === block.id
                                 ? "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white opacity-70 hover:opacity-100"
                                 : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white opacity-70 hover:opacity-100"
                             }
                           `}
                          title={t.copyText}
                        >
                          {copiedBlockId === block.id ? (
                            <Icons.check className="w-4 h-4" />
                          ) : (
                            <Icons.copy className="w-4 h-4" />
                          )}
                        </Button>
                      </Tooltip>
                      {/* Show original text reference if available */}
                      {block.translation?.text && (
                        <div className="mt-2 pt-2 border-t border-green-800/30">
                          <p className="text-xs text-gray-400 italic">
                            {language === "en" ? "Original: " : "Algne: "}
                            {block.translation.text.length > 100
                              ? block.translation.text.substring(0, 100) + "..."
                              : block.translation.text}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollShadow>
            </div>
          </div>
        ) : (
          /* Single-screen layout for normal mode */
          <ScrollShadow
            className="text-white scroll-smooth overflow-auto p-4 space-y-3"
            style={{ fontSize: `${textSize}rem`, lineHeight: lineHeight }}
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
      </div>
    );
  }
);

CaptionDisplay.displayName = "CaptionDisplay";

export default CaptionDisplay;
