// components/header/ZoomApiSwitchComponent.tsx

"use client";

import { Switch, cn, Input, Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { useSettings } from "../SettingsContext";

declare global {
  interface Window {
    setZoomSettings?: (enabled: boolean, token: string) => void;
  }
}

export default function ZoomApiSwitchComponent() {
  const {
    zoomEnabled,
    setZoomEnabled,
    zoomApiToken,
    setZoomApiToken,
    language,
  } = useSettings();

  // Local state to hold the Zoom API Token before saving
  const [localZoomApiToken, setLocalZoomApiToken] = useState(zoomApiToken);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const translations = {
    en: {
      addCaptionsToZoom: "Add captions to Zoom",
      captionsWillBeDisplayed: "Captions will be displayed in the Zoom app",
      zoomApiTokenLabel: "Zoom API Token",
      zoomApiTokenPlaceholder: "Example: https://wmcc.zoom.us/",
      save: "Save",
      tokenSavedSuccess: "Zoom API Token saved successfully!",
      tokenSaveError:
        "Please enter a valid Zoom API Token (e.g. https://wmcc.zoom.us/)",
    },
    et: {
      addCaptionsToZoom: "Lisa subtiitrid Zoomi",
      captionsWillBeDisplayed: "Subtiitrid kuvatakse Zoomi rakenduses",
      zoomApiTokenLabel: "Zoomi API märk",
      zoomApiTokenPlaceholder: "Näide: https://wmcc.zoom.us/",
      save: "Salvesta",
      tokenSavedSuccess: "Zoomi API märk edukalt salvestatud!",
      tokenSaveError:
        "Palun sisestage kehtiv Zoomi API märk (nt https://wmcc.zoom.us/)",
    },
  };

  const t = translations[language as "en" | "et"] || translations.en;

  // Synchronize localZoomApiToken with global zoomApiToken
  useEffect(() => {
    setLocalZoomApiToken(zoomApiToken);
  }, [zoomApiToken]);

  // Function to update Zoom settings in app-asr.js
  const updateZoomSettings = (enabled: boolean, token: string) => {
    if (window.setZoomSettings) {
      window.setZoomSettings(enabled, token);
    }
  };

  // Handler for the Save button (saves ZoomApiToken)
  const handleSave = () => {
    const patternZoomApiToken = new RegExp("https://[a-z0-9]+.zoom");
    if (!patternZoomApiToken.test(localZoomApiToken)) {
      setSaveSuccess(false);
      setSaveError(true);
      return;
    }

    setSaveError(false);
    setIsSaving(true);
    // Update global ZoomApiToken
    setZoomApiToken(localZoomApiToken);
    // Call the update function with current zoomEnabled and new token
    updateZoomSettings(zoomEnabled, localZoomApiToken);
    setIsSaving(false);
    setSaveSuccess(true);
    // Hide the success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handler for toggling zoomEnabled (saves immediately)
  const handleToggle = (checked: boolean) => {
    setZoomEnabled(checked);
    // When disabling, you might choose to clear the token or keep it as is
    // Here, we keep the token unchanged
    updateZoomSettings(checked, zoomApiToken);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Zoom Enabled Switch */}
      <Switch
        style={{ touchAction: "pan-y" }}
        isSelected={zoomEnabled}
        onChange={(e) => handleToggle(e.target.checked)}
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
          <p className="text-medium text-white">{t.addCaptionsToZoom}</p>
          <p className="text-tiny text-white">{t.captionsWillBeDisplayed}</p>
        </div>
      </Switch>

      {/* Zoom API Token Input and Save Button (only visible when zoomEnabled is true) */}
      {zoomEnabled && (
        <div className="flex flex-col mt-1 gap-2 bg-gray-900 rounded-lg p-3">
          <Input
            type="text"
            placeholder={t.zoomApiTokenPlaceholder}
            label={t.zoomApiTokenLabel}
            variant="bordered"
            size="lg"
            color="primary"
            value={localZoomApiToken}
            onChange={(e) => setLocalZoomApiToken(e.target.value)}
          />
          <Button
            type="button"
            size="md"
            color="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
          >
            {t.save}
          </Button>
          {saveSuccess && (
            <p className="text-green-500 text-sm">{t.tokenSavedSuccess}</p>
          )}
          {saveError && (
            <p className="text-red-500 text-sm">{t.tokenSaveError}</p>
          )}
        </div>
      )}
    </div>
  );
}
