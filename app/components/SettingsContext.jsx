
"use client";

import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
  const [textSize, setTextSize] = useState(3);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [showSoundClips, setShowSoundClips] = useState(true);

  return (
    <SettingsContext.Provider value={{ textSize, setTextSize, lineHeight, setLineHeight, showSoundClips, setShowSoundClips }}>
      {children}
    </SettingsContext.Provider>
  );
};

