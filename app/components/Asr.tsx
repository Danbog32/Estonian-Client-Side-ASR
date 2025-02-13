"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useSettings } from "./SettingsContext";
import CaptionDisplay from "./CaptionDisplay";
import GreetingLoading from "./GreetingLoading";

export default function Asr() {
  const { textSize, lineHeight } = useSettings();
  const { language } = useSettings() as { language: "en" | "et" };
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Translation strings for different languages
  const translations = {
    en: {
      heading: "Estonian Automatic Speech Recognition",
      downloadingModel: "Downloading model, please wait...",
      initializingModel: "Initializing ASR model, just a second...",
    },
    et: {
      heading: "Eesti automaatne kõnetuvastus",
      downloadingModel: "Laen mudelit, palun oodake...",
      initializingModel: "Käivitab ASR-mudeli, hetk...",
    },
  };

  // Set the loading message based on the selected language
  useEffect(() => {
    setLoadingMessage(
      translations[language]?.downloadingModel ||
        translations.en.downloadingModel
    );
  }, [language]);

  // Listen for the modelInitialized event, which will be fired from app-asr.js
  useEffect(() => {
    const handleModelInitialized = () => {
      setLoading(false);
    };
    window.addEventListener("modelInitialized", handleModelInitialized);
    return () => {
      window.removeEventListener("modelInitialized", handleModelInitialized);
    };
  }, []);

  return (
    <div className="bg-gray-800 flex flex-col items-center h-[calc(100vh-108px)]">
      <Script
        src={`./onnx/sherpa-onnx-wasm-main-asr.js`}
        strategy="afterInteractive"
        onLoad={() => console.log("sherpa-onnx-wasm-main-asr loaded")}
      />
      <Script
        src={`./onnx/sherpa-onnx-asr.js`}
        strategy="afterInteractive"
        onLoad={() => console.log("sherpa-onnx-asr loaded")}
      />
      <Script
        src={`./onnx/app-asr.js`}
        strategy="afterInteractive"
        onLoad={() => console.log("app-asr loaded")}
      />

      {loading && <GreetingLoading loadingMessage={loadingMessage} />}

      <CaptionDisplay
        textSize={textSize}
        lineHeight={lineHeight}
        loading={loading}
      />
    </div>
  );
}
