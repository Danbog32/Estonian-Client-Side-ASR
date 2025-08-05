import React, { useState, useEffect, memo } from "react";
import { ScrollShadow, Tooltip, Button } from "@heroui/react";
import StartSpeakingPrompt from "./StartSpeakingPrompt";
import { Icons } from "./icons";
import { useSettings } from "./SettingsContext";

interface TranscriptBlock {
  id: string;
  text: string;
  isComplete: boolean;
  timestamp: string;
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
    const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
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

    useEffect(() => {
      const handleTranscriptUpdate = (event: CustomEvent) => {
        const { blocks } = event.detail;
        setTranscriptBlocks(blocks || []);
      };

      // Listen for transcript updates from the ASR script
      window.addEventListener(
        "transcriptUpdate",
        handleTranscriptUpdate as EventListener
      );

      return () => {
        window.removeEventListener(
          "transcriptUpdate",
          handleTranscriptUpdate as EventListener
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

        {/* Modern block-based transcript display */}
        <ScrollShadow
          className="text-white scroll-smooth overflow-auto p-4 space-y-3"
          style={{ fontSize: `${textSize}rem`, lineHeight: lineHeight }}
        >
          {!loading && transcriptBlocks.length === 0 && <StartSpeakingPrompt />}

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
      </div>
    );
  }
);

CaptionDisplay.displayName = "CaptionDisplay";

export default CaptionDisplay;
