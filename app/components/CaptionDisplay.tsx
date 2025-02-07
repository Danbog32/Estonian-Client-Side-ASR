"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSettings } from "./SettingsContext";
import { ScrollShadow } from "@nextui-org/react";

interface CaptionDisplayProps {
  textSize: number;
  lineHeight: number;
}

const CaptionDisplay: React.FC<CaptionDisplayProps> = ({
  textSize,
  lineHeight,
}) => {
  const [transcript, setTranscript] = useState("");
  const { language } = useSettings();

  return (
    <div className="flex flex-col h-full max-w-full justify-end">
      {/* This is the scrollable container */}
      {/* <div className="h-full flex flex-col justify-end mx-4"> */}
      {/* Transcript content */}
      <ScrollShadow
        id="transcriptText"
        className="text-white scroll-smooth overflow-auto p-4"
        style={{ fontSize: `${textSize}rem`, lineHeight: lineHeight }}
      >
        {transcript || "Waiting for transcript..."}
      </ScrollShadow>
      {/* </div> */}
    </div>
  );
};

export default CaptionDisplay;
