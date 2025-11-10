// components/SettingsContext.jsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
  const [textSize, setTextSize] = useState(3);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [subtitleMode, setSubtitleMode] = useState(false);

  // Add new state variables
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [zoomApiToken, setZoomApiToken] = useState("");
  const [captionName, setCaptionName] = useState("");
  const [captionURL, setCaptionURL] = useState("");
  const [language, setLanguage] = useState("et"); // Add language state
  const [translationEnabled, setTranslationEnabled] = useState(false); // Add translation state

  const SETTINGS_STORAGE_KEY = "settings:v1";
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);

  // Load saved preferences on mount (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.textSize === "number") setTextSize(saved.textSize);
      if (typeof saved.lineHeight === "number") setLineHeight(saved.lineHeight);
      if (typeof saved.language === "string") setLanguage(saved.language);
    } catch (_e) {
      // Ignore malformed JSON or storage errors
    } finally {
      setHasRestoredFromStorage(true);
    }
  }, []);

  // Persist preferences when they change
  useEffect(() => {
    if (!hasRestoredFromStorage) return; // avoid overwriting saved values on first mount
    try {
      const toStore = {
        textSize,
        lineHeight,
        language,
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toStore));
    } catch (_e) {
      // Ignore storage write errors (quota, privacy mode, etc.)
    }
  }, [textSize, lineHeight, language, hasRestoredFromStorage]);

  return (
    <SettingsContext.Provider
      value={{
        textSize,
        setTextSize,
        lineHeight,
        setLineHeight,
        subtitleMode,
        setSubtitleMode,
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
