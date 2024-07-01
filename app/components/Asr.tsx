"use client";

import { useEffect, useState } from "react";
import { Progress } from "@nextui-org/react";
import { useSettings } from "./SettingsContext"; // Adjust the path as necessary
import TextAreaDisplay from "./TextAreaDisplay"; // Adjust the path as necessary
import AudioSection from "./AudioSection"; // Adjust the path as necessary

export default function Asr() {
  const [loading, setLoading] = useState(true);
  const { textSize, lineHeight, showSoundClips } = useSettings();

  useEffect(() => {
    const loadScripts = async () => {
      const timestamp = new Date().getTime();
      const scripts = [
        {
          src: `wasm/sherpa-ncnn-wasm-main.js?v=${timestamp}`,
          check: "startBtn",
        },
        { src: `wasm/sherpa-ncnn.js?v=${timestamp}`, check: "Stream" },
        { src: `wasm/app.js?v=${timestamp}` },
      ];

      const totalScripts = scripts.length;
      let loadedScripts = 0;

      const updateProgress = () => {
        loadedScripts += 1;
        if (loadedScripts === totalScripts) {
          setLoading(false);
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

  return (
    <div className="bg-gray-800 flex flex-col items-center">
      <div className="flex flex-col items-center min-h-[calc(100vh-140px)] w-full max-w-[1200px] text-white">
        <div className="w-full p-8 relative h-full">
          <h1 className="sm:text-3xl md:text-2xl text-xl font-bold mb-6 text-center">
            Estonian Automatic Speech Recognition
          </h1>

          {loading && (
            <Progress
              size="sm"
              isIndeterminate
              aria-label="Loading..."
              className="full-w"
            />
          )}
          <span id="hint" className="mb-4 text-lg text-gray-300">
            {loading ? "Loading the model..." : ""}
          </span>

          <TextAreaDisplay textSize={textSize} lineHeight={lineHeight} />

          <AudioSection showSoundClips={showSoundClips} />
        </div>
      </div>
    </div>
  );
}
