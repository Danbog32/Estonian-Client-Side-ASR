// components/header/ZoomApiSwitchComponent.tsx

"use client";

import { Switch, cn, Input } from "@nextui-org/react";
import { useEffect } from "react";
import { useSettings } from "../SettingsContext";

declare global {
  interface Window {
    setZoomSettings?: (enabled: boolean, token: string) => void;
  }
}

export default function ZoomApiSwitchComponent() {
  const { zoomEnabled, setZoomEnabled, zoomApiToken, setZoomApiToken } =
    useSettings();

  // Function to update Zoom settings in app-asr.js
  const updateZoomSettings = (enabled: boolean, token: string) => {
    if (window.setZoomSettings) {
      window.setZoomSettings(enabled, token);
    }
  };

  // Effect to call updateZoomSettings when zoomEnabled or zoomApiToken changes
  useEffect(() => {
    updateZoomSettings(zoomEnabled, zoomApiToken);
  }, [zoomEnabled, zoomApiToken]);

  return (
    <div className="flex flex-col gap-2">
      <Switch
        isSelected={zoomEnabled}
        onChange={(e) => setZoomEnabled(e.target.checked)}
        classNames={{
          base: cn(
            "inline-flex flex-row-reverse w-full max-w-md bg-content1 hover:bg-content2 items-center",
            "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
            "data-[selected=true]:border-primary"
          ),
          wrapper: "p-0 h-4 overflow-visible",
          thumb: cn(
            "w-6 h-6 border-2 shadow-lg",
            "group-data-[hover=true]:border-primary",
            // selected
            "group-data-[selected=true]:ml-6",
            // pressed
            "group-data-[pressed=true]:w-7",
            "group-data-[selected]:group-data-[pressed]:ml-4"
          ),
        }}
      >
        <div className="flex flex-col gap-1">
          <p className="text-medium">Add captions to Zoom</p>
          <p className="text-tiny text-grey-400">
            Captions will be displayed in the Zoom app.
          </p>
        </div>
      </Switch>
      {zoomEnabled && (
        <Input
          type="text"
          placeholder="Enter Zoom API Token"
          variant="bordered"
          value={zoomApiToken}
          onChange={(e) => setZoomApiToken(e.target.value)}
        />
      )}
    </div>
  );
}
