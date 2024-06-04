"use client";

import { useEffect, useState } from "react";

export default function Asr() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalScripts = 3;
    let loadedScripts = 0;

    // Function to update progress
    const updateProgress = () => {
      loadedScripts += 1;
      setProgress((loadedScripts / totalScripts) * 100);
      if (loadedScripts === totalScripts) {
        setLoading(false);
      }
    };

    // Load the necessary scripts
    const loadScripts = async () => {
      const scripts = [
        { src: "wasm/sherpa-ncnn-wasm-main.js", check: "startBtn" },
        { src: "wasm/sherpa-ncnn.js", check: "Stream" },
        { src: "wasm/app.js" },
      ];

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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Estonian Automatic Speech Recognition
      </h1>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8 relative">
        {loading && (
          <div className="w-full h-1.5 bg-gray-200 rounded-t-lg overflow-hidden">
            <div
              className="h-1.5 bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        <span id="hint" className="block mb-4 text-lg text-gray-700">
          Loading model ... {Math.round(progress)}%
        </span>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            id="startBtn"
            disabled
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded transition duration-300 disabled:opacity-50"
          >
            Start
          </button>
          <button
            id="stopBtn"
            disabled
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded transition duration-300 disabled:opacity-50"
          >
            Stop
          </button>
          <button
            id="clearBtn"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded transition duration-300"
          >
            Clear
          </button>
        </div>
        <textarea
          id="results"
          rows={10}
          readOnly
          className="w-full p-2 border rounded"
          style={{ resize: "none" }}
          value={"Waiting for audio input ..."}
        ></textarea>
      </div>

      <section
        style={{ flex: 1, overflow: "auto" }}
        id="sound-clips"
        className="w-full max-w-2xl bg-white rounded-lg shadow-md mt-8 p-8"
      >
        <span id="hint" className="block mb-4 text-lg text-gray-700">
          Sound clips
        </span>
      </section>
    </div>
  );
}
