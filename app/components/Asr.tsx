"use client";

import { useEffect, useState } from "react";
import { Progress } from "@nextui-org/react";
import { useSettings } from "./SettingsContext"; // Adjust the path as necessary
import TextAreaDisplay from "./TextAreaDisplay"; // Adjust the path as necessary
import AudioSection from "./AudioSection"; // Adjust the path as necessary
import Script from "next/script";

export default function Asr() {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Downloading model, please wait..."
  );
  const { textSize, lineHeight, showSoundClips } = useSettings();

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
          setLoadingMessage("Initializing asr model, just a second...");
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
    <div>
      <Script
        src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"
        strategy="beforeInteractive"
      ></Script>
      <Script
        src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"
        strategy="beforeInteractive"
      ></Script>

      {/* Initialize Firebase */}
      <Script id="firebase-init" strategy="afterInteractive">
        {`
          var firebaseConfig = ${JSON.stringify({
            apiKey: process.env.NEXT_PUBLIC_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_APP_ID,
            measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
          })};
          // Initialize Firebase
          if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
          }
          window.db = firebase.firestore();
        `}
      </Script>

      <div className="bg-gray-800 flex flex-col items-center">
        <div className="flex flex-col items-center min-h-[calc(100vh-140px)] w-full max-w-[1200px] text-white">
          <div className="w-full p-8 relative h-full">
            <h1 className="sm:text-3xl md:text-2xl text-xl font-bold mb-6 text-center">
              Estonian Automatic Speech Recognition
            </h1>

            {loading && (
              <>
                <Progress
                  size="sm"
                  isIndeterminate
                  aria-label="Loading..."
                  className="full-w"
                />
                <span id="hint" className="mb-4 text-lg text-gray-300">
                  {loadingMessage}
                </span>
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
    </div>
  );
}
