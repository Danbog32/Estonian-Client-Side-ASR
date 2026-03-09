"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useSettings } from "../providers/SettingsContext";
import CaptionDisplay from "./CaptionDisplay";
import GreetingLoading from "./GreetingLoading";

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
  const { displaySettings, language } = useSettings();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    setLoadingMessage(
      translations[language]?.downloadingModel ||
        translations.en.downloadingModel,
    );
  }, [language]);

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
    <div
      className="flex flex-col items-center h-[calc(100vh-108px)] transition-colors duration-200"
      style={{
        backgroundColor: displaySettings.backgroundColor,
        color: displaySettings.textColor,
      }}
    >
      <Script
        src={`onnx/app-asr.js`}
        strategy="afterInteractive"
        onLoad={() => console.log("app-asr loaded")}
      />

      {loading && <GreetingLoading loadingMessage={loadingMessage} />}

      <h1 className="text-2xl md:text-3xl font-semibold mt-6 text-center px-4 sr-only">
        {translations[language]?.heading || translations.en.heading}
      </h1>
      <p className="mt-3 max-w-2xl text-center px-4 sr-only opacity-75">
        {language === "et"
          ? "Tasuta, ilma sisselogimiseta. Reaalajas eesti kõnekirjutus ja eesti→inglise subtiitrid otse brauseris."
          : "Free and no login required. Real-time Estonian speech-to-text and Estonian→English live captions in your browser."}
      </p>

      <CaptionDisplay settings={displaySettings} loading={loading} />

      <div id="sound-clips" style={{ display: "none" }}></div>
    </div>
  );
}
