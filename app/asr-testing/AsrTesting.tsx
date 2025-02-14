// components/AsrTesting.tsx

"use client";

import { useEffect, useState } from "react";
import { Progress } from "@heroui/react";
import { useSettings } from "../components/SettingsContext";
import TextAreaDisplay from "../components/TextAreaDisplay";
import AudioSection from "./AudioSection";

export default function AsrTesting() {
  const [loading, setLoading] = useState(true);
  const { textSize, lineHeight, showSoundClips, language } = useSettings() as {
    textSize: number;
    lineHeight: number;
    showSoundClips: boolean;
    language: "en" | "et";
  };
  const [loadingMessage, setLoadingMessage] = useState("");

  // Translations for different languages
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

  // Get the appropriate translations based on the selected language
  const t = translations[language] || translations.en;

  // Set the initial loading message based on the language
  useEffect(() => {
    setLoadingMessage(translations[language].downloadingModel);
  }, [language]);

  useEffect(() => {
    const loadScripts = async () => {
      const timestamp = new Date().getTime();
      const scripts = [
        {
          src: `onnx/sherpa-onnx-wasm-main-asr.js?v=${timestamp}`,
          check: "startBtn",
        },
        { src: `onnx/sherpa-onnx-asr.js?v=${timestamp}`, check: "Stream" },
        { src: `onnx/app-asr.js` },
      ];

      const totalScripts = scripts.length;
      let loadedScripts = 0;

      const updateProgress = () => {
        loadedScripts += 1;
        if (loadedScripts === totalScripts) {
          setLoadingMessage("Laen mudelit, palun oodake...");
        }
      };

      for (const { src, check } of scripts) {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
          if (check && typeof (window as any)[check] !== "undefined") {
            console.warn(
              `${check} already defined, skipping initialization of ${src}`
            );
          }
          updateProgress();
        };
        document.body.appendChild(script);
      }
    };

    loadScripts();
  }, []);

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
    <div className="bg-gray-800 flex flex-col items-center">
      <div className="flex flex-col items-center min-h-[calc(100vh-140px)] w-full max-w-[1200px] text-white">
        <div className="w-full p-8 relative h-full">
          <h1 className="sm:text-3xl md:text-2xl text-xl font-bold mb-6 text-center">
            {t.heading}
          </h1>

          {loading && (
            <>
              <span id="hint" className="mb-4 text-lg text-gray-300">
                {loadingMessage}
              </span>
              <Progress
                size="sm"
                isIndeterminate
                aria-label="Loading..."
                className="full-w"
              />
            </>
          )}

          <TextAreaDisplay textSize={textSize} lineHeight={lineHeight} />
          {/* Display the caption link if available */}
          <div
            id="captionLink"
            className="mt-4 text-center text-lg text-blue-500"
          >
            {/* The caption link will be injected here */}
          </div>
          <AudioSection showSoundClips={showSoundClips} />
        </div>
      </div>
    </div>
  );
}
