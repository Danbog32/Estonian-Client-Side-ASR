// components/SettingsContext.jsx

"use client";

import React, { createContext, useContext, useState } from "react";

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
  const [textSize, setTextSize] = useState(3);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [showSoundClips, setShowSoundClips] = useState(true);
  const [subtitleMode, setSubtitleMode] = useState(false);

  // Add new state variables
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [zoomApiToken, setZoomApiToken] = useState("");
  const [captionName, setCaptionName] = useState("");
  const [captionURL, setCaptionURL] = useState("");
  const [language, setLanguage] = useState("et"); // Add language state
  // const [focusMode, setFocusMode] = useState(false); // Add focusMode state

  return (
    <SettingsContext.Provider
      value={{
        textSize,
        setTextSize,
        lineHeight,
        setLineHeight,
        showSoundClips,
        setShowSoundClips,
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
        // focusMode,
        // setFocusMode,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
