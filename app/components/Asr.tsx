"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useSettings } from "../providers/SettingsContext";
import CaptionDisplay from "./CaptionDisplay";
import GreetingLoading from "./GreetingLoading";

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

export default function Asr() {
  const { textSize, lineHeight } = useSettings();
  const { language } = useSettings() as { language: "en" | "et" };
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");

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
        src={`onnx/app-asr.js`}
        strategy="afterInteractive"
        onLoad={() => console.log("app-asr loaded")}
      />

      {loading && <GreetingLoading loadingMessage={loadingMessage} />}

      <h1 className="text-white text-2xl md:text-3xl font-semibold mt-6 text-center px-4 sr-only">
        {translations[language]?.heading || translations.en.heading}
      </h1>
      <p className="text-gray-300 mt-3 max-w-2xl text-center px-4 sr-only">
        {language === "et"
          ? "Tasuta, ilma sisselogimiseta. Reaalajas eesti kõnekirjutus ja eesti→inglise subtiitrid otse brauseris."
          : "Free and no login required. Real-time Estonian speech-to-text and Estonian→English live captions in your browser."}
      </p>

      <CaptionDisplay
        textSize={textSize}
        lineHeight={lineHeight}
        loading={loading}
      />

      {/* Hidden elements that app-asr.js expects but doesn't exist in React app */}
      <div id="sound-clips" style={{ display: "none" }}></div>
    </div>
  );
}
