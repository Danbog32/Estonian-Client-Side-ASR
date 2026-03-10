"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SHARED_COLOR_PRESETS } from "../components/settings/sharedColorPresets";

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const COLOR_PRESETS = SHARED_COLOR_PRESETS.map((preset) => ({
  name: preset.key,
  textColor: preset.textColor,
  backgroundColor: preset.backgroundColor,
}));

export const SettingsProvider = ({ children }) => {
  const [textSize, setTextSize] = useState(3);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [subtitleMode, setSubtitleMode] = useState(false);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#000000");

  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [zoomApiToken, setZoomApiToken] = useState("");
  const [captionName, setCaptionName] = useState("");
  const [captionURL, setCaptionURL] = useState("");
  const [language, setLanguage] = useState("et");
  const [translationEnabled, setTranslationEnabled] = useState(false);

  const SETTINGS_STORAGE_KEY = "settings:v2";
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        const v1Raw = localStorage.getItem("settings:v1");
        if (v1Raw) {
          const v1 = JSON.parse(v1Raw);
          if (typeof v1.textSize === "number") setTextSize(v1.textSize);
          if (typeof v1.lineHeight === "number") setLineHeight(v1.lineHeight);
          if (typeof v1.language === "string") setLanguage(v1.language);
        }
        return;
      }
      const saved = JSON.parse(raw);
      if (typeof saved.textSize === "number") setTextSize(saved.textSize);
      if (typeof saved.lineHeight === "number") setLineHeight(saved.lineHeight);
      if (typeof saved.language === "string") setLanguage(saved.language);
      if (typeof saved.textColor === "string") setTextColor(saved.textColor);
      if (typeof saved.backgroundColor === "string")
        setBackgroundColor(saved.backgroundColor);
    } catch (_e) {
      // ignore
    } finally {
      setHasRestoredFromStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredFromStorage) return;
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          textSize,
          lineHeight,
          language,
          textColor,
          backgroundColor,
        }),
      );
    } catch (_e) {
      // ignore
    }
  }, [
    textSize,
    lineHeight,
    language,
    textColor,
    backgroundColor,
    hasRestoredFromStorage,
  ]);

  return (
    <SettingsContext.Provider
      value={{
        textSize,
        setTextSize,
        lineHeight,
        setLineHeight,
        subtitleMode,
        setSubtitleMode,
        textColor,
        setTextColor,
        backgroundColor,
        setBackgroundColor,
        firebaseEnabled,
        setFirebaseEnabled,
        zoomEnabled,
        setZoomEnabled,
        zoomApiToken,
        setZoomApiToken,
        captionName,
        setCaptionName,
        captionURL,
        setCaptionURL,
        language,
        setLanguage,
        translationEnabled,
        setTranslationEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
