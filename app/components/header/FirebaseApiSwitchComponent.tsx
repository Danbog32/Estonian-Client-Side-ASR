// components/header/FirebaseApiSwitchComponent.tsx

"use client";

import { Switch, cn } from "@nextui-org/react";
import { useEffect } from "react";
import { useSettings } from "../SettingsContext";

declare global {
  interface Window {
    setFirebaseSettings?: (enabled: boolean, captionName: string) => void;
  }
}

export default function FirebaseApiSwitchComponent() {
  const {
    firebaseEnabled,
    setFirebaseEnabled,
    captionName,
    setCaptionName,
    captionURL,
    setCaptionURL,
  } = useSettings();

  // Function to update Firebase settings in app-asr.js
  const updateFirebaseSettings = (enabled: boolean, name: string) => {
    if (window.setFirebaseSettings) {
      window.setFirebaseSettings(enabled, name);
    }
  };

  // Function to generate a unique caption name
  const generateCaptionName = () => {
    const uniqueId = `caption-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;
    return uniqueId;
  };

  // Effect to handle firebaseEnabled changes
  useEffect(() => {
    if (firebaseEnabled) {
      // Generate captionName and captionURL if not already generated
      if (!captionName) {
        const name = generateCaptionName();
        setCaptionName(name);
        const url = `${window.location.origin}/${name}`;
        setCaptionURL(url);
        // Update Firebase settings in app-asr.js
        updateFirebaseSettings(firebaseEnabled, name);
      }
    } else {
      setCaptionName("");
      setCaptionURL("");
      // Update Firebase settings in app-asr.js
      updateFirebaseSettings(firebaseEnabled, "");
    }
  }, [captionName, firebaseEnabled, setCaptionName, setCaptionURL]);

  return (
    <div className="flex flex-col gap-2">
      <Switch
        isSelected={firebaseEnabled}
        onChange={(e) => setFirebaseEnabled(e.target.checked)}
        classNames={{
          base: cn(
            "inline-flex flex-row-reverse w-full max-w-md bg-gray-900 hover:bg-gray-800 hover:border-dashed items-center",
            "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-gray-900",
            "data-[selected=true]:border-white data-[selected=true]:bg-gray-700"
          ),
          wrapper: "p-0 h-4 overflow-visible",
          thumb: cn(
            "w-6 h-6 border-2 shadow-lg",
            "group-data-[hover=true]:border-white",
            // selected
            "group-data-[selected=true]:ml-6",
            // pressed
            "group-data-[pressed=true]:w-7",
            "group-data-[selected]:group-data-[pressed]:ml-4"
          ),
        }}
      >
        <div className="flex flex-col gap-1">
          <p className="text-medium text-white">
            Cast captions to multiple people
          </p>
          <p className="text-tiny text-white">
            Captions will be sent to multiple people who have the link.
          </p>
        </div>
      </Switch>
      {firebaseEnabled && captionURL && (
        <div className="flex flex-col mt-1 gap-2 bg-gray-900 rounded-lg p-3">
          <p>Your live captions are available at:</p>
          <a
            href={captionURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            {captionURL}
          </a>
        </div>
      )}
    </div>
  );
}
