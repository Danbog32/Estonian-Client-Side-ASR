import { useEffect, useState } from "react";

interface AsrLoaderProps {
  onReady: (recognizer: any) => void;
}

const AsrLoader: React.FC<AsrLoaderProps> = ({ onReady }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAsrModule = async () => {
      try {
        console.log("Starting to load ASR module");
        const script = document.createElement("script");
        script.src = "/wasm/sherpa-ncnn-wasm-main.js";
        script.async = true;

        script.onload = () => {
          console.log("Script loaded");

          const waitForModule = () => {
            if (window.Module) {
              console.log("Module object is defined");
              window.Module.onRuntimeInitialized = () => {
                console.log("Runtime initialized");
                if (window.Module.createRecognizer) {
                  console.log("createRecognizer function found on Module");
                  const recognizerInstance = window.Module.createRecognizer();
                  console.log("Recognizer created", recognizerInstance);
                  onReady(recognizerInstance);
                  setLoading(false);
                } else {
                  console.error(
                    "createRecognizer function is not defined on Module."
                  );
                  setLoading(false);
                }
              };

              if (window.Module.calledRun) {
                console.log(
                  "Runtime already initialized, calling onRuntimeInitialized directly"
                );
                window.Module.onRuntimeInitialized();
              }
            } else {
              console.error("Module object is not defined. Retrying...");
              setTimeout(waitForModule, 100); // Retry after 100ms
            }
          };

          waitForModule();
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
