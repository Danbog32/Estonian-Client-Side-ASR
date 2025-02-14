import React from "react";
import { ScrollShadow } from "@heroui/react";
import StartSpeakingPrompt from "./StartSpeakingPrompt";

interface CaptionDisplayProps {
  textSize: number;
  lineHeight: number;
  loading: boolean;
}

const CaptionDisplay: React.FC<CaptionDisplayProps> = ({
  textSize,
  lineHeight,
  loading,
}) => {
  return (
    <div className="flex flex-col h-full max-w-full justify-end">
      {/* Transcript content */}
      <ScrollShadow
        id="transcriptText"
        className="text-white scroll-smooth overflow-auto p-4"
        style={{ fontSize: `${textSize}rem`, lineHeight: lineHeight }}
      >
        {!loading && <StartSpeakingPrompt />}
      </ScrollShadow>
    </div>
  );
};

export default CaptionDisplay;
