 "use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CAPTION_VIEWER_SETTINGS,
  sanitizeCaptionViewerSettings,
  type CaptionViewerSettings,
} from "../components/viewer/captionViewerSettings";

type Language = "en" | "et";

type SettingsContextValue = {
  // Display settings for the main ASR view
  displaySettings: CaptionViewerSettings;
  setDisplaySettings: (next: CaptionViewerSettings) => void;
  updateDisplaySettings: (partial: Partial<CaptionViewerSettings>) => void;
  resetDisplaySettings: () => void;

  // Existing global settings
  subtitleMode: boolean;
  setSubtitleMode: (value: boolean) => void;

  firebaseEnabled: boolean;
  setFirebaseEnabled: (value: boolean) => void;

  zoomEnabled: boolean;
  setZoomEnabled: (value: boolean) => void;

  zoomApiToken: string;
  setZoomApiToken: (value: string) => void;

  captionName: string;
  setCaptionName: (value: string) => void;

  captionURL: string;
  setCaptionURL: (value: string) => void;

  language: Language;
  setLanguage: (value: Language) => void;

  translationEnabled: boolean;
  setTranslationEnabled: (value: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
};

const SETTINGS_STORAGE_KEY = "settings:v1";
const MAIN_DISPLAY_SETTINGS_STORAGE_KEY = "main-display-settings:v1";

type SettingsProviderProps = {
  children: ReactNode;
};

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  // Display settings for the main ASR page
  const [displaySettings, setDisplaySettingsState] =
    useState<CaptionViewerSettings>(DEFAULT_CAPTION_VIEWER_SETTINGS);
  const [hasRestoredDisplayFromStorage, setHasRestoredDisplayFromStorage] =
    useState(false);

  // Legacy/global settings
  const [subtitleMode, setSubtitleMode] = useState(false);

  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [zoomApiToken, setZoomApiToken] = useState("");
  const [captionName, setCaptionName] = useState("");
  const [captionURL, setCaptionURL] = useState("");
  const [language, setLanguage] = useState<Language>("et");
  const [translationEnabled, setTranslationEnabled] = useState(false);

  const [hasRestoredCoreFromStorage, setHasRestoredCoreFromStorage] =
    useState(false);

  // Load saved core preferences (language etc.) on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        language?: Language;
      };

      if (saved.language === "en" || saved.language === "et") {
        setLanguage(saved.language);
      }
    } catch {
      // Ignore malformed JSON or storage errors
    } finally {
      setHasRestoredCoreFromStorage(true);
    }
  }, []);

  // Persist core preferences when they change
  useEffect(() => {
    if (!hasRestoredCoreFromStorage) return;
    try {
      const toStore = {
        language,
      };
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Ignore storage write errors (quota, privacy mode, etc.)
    }
  }, [language, hasRestoredCoreFromStorage]);

  // Load display settings for the main page
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(
        MAIN_DISPLAY_SETTINGS_STORAGE_KEY,
      );
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setDisplaySettingsState(sanitizeCaptionViewerSettings(parsed));
    } catch {
      // Ignore malformed JSON or storage errors
    } finally {
      setHasRestoredDisplayFromStorage(true);
    }
  }, []);

  // Persist display settings when they change
  useEffect(() => {
    if (!hasRestoredDisplayFromStorage) return;
    try {
      window.localStorage.setItem(
        MAIN_DISPLAY_SETTINGS_STORAGE_KEY,
        JSON.stringify(displaySettings),
      );
    } catch {
      // Ignore storage write errors (quota, privacy mode, etc.)
    }
  }, [displaySettings, hasRestoredDisplayFromStorage]);

  const setDisplaySettings = (next: CaptionViewerSettings) => {
    setDisplaySettingsState(sanitizeCaptionViewerSettings(next));
  };

  const updateDisplaySettings = (partial: Partial<CaptionViewerSettings>) => {
    setDisplaySettingsState((prev) =>
      sanitizeCaptionViewerSettings({ ...prev, ...partial }),
    );
  };

  const resetDisplaySettings = () => {
    setDisplaySettingsState(DEFAULT_CAPTION_VIEWER_SETTINGS);
  };

  const value: SettingsContextValue = {
    displaySettings,
    setDisplaySettings,
    updateDisplaySettings,
    resetDisplaySettings,
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
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

