"use client";

import { useEffect, useState } from "react";

interface AsrLoaderProps {
  onReady: (recognizer: any) => void;
}

const AsrLoader: React.FC<AsrLoaderProps> = ({ onReady }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAsrModule = async () => {
      try {
        // Create a script element to load the main JS file
        const script = document.createElement("script");
        script.src = "/wasm/sherpa-ncnn-wasm-main.js"; // Updated path here
        script.async = true;
        script.onload = () => {
          // Initialize the Module object
          const Module: any = {
            locateFile: (path: string, scriptDirectory: string) => {
              if (path.endsWith(".wasm") || path.endsWith(".data")) {
                return "/wasm/" + path; // Updated path here
              }
              return scriptDirectory + path;
            },
            onRuntimeInitialized: () => {
              console.log("ASR model initialized!");
              const recognizerInstance = (
                window as any
              ).Module.createRecognizer();
              onReady(recognizerInstance);
              setLoading(false);
            },
          };

          // Assign the Module to window object so the loaded script can access it
          (window as any).Module = Module;

          // Initialize the module
          (window as any).Module.onRuntimeInitialized();
        };

        script.onerror = (err) => {
          console.error("Error loading ASR module:", err);
          setLoading(false);
        };

        document.body.appendChild(script);
      } catch (err) {
        console.error("Error loading ASR module:", err);
        setLoading(false);
      }
    };

    loadAsrModule();
  }, [onReady]);

  return (
    <div>
      {loading ? (
        <span>Loading ASR model ...</span>
      ) : (
        <span>ASR model loaded! Please click start</span>
      )}
    </div>
  );
};

export default AsrLoader;
