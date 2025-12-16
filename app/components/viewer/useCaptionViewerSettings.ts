"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CAPTION_VIEWER_SETTINGS_STORAGE_KEY,
  DEFAULT_CAPTION_VIEWER_SETTINGS,
  sanitizeCaptionViewerSettings,
  type CaptionViewerSettings,
} from "./captionViewerSettings";

type UseCaptionViewerSettingsResult = {
  settings: CaptionViewerSettings;
  setSettings: (next: CaptionViewerSettings) => void;
  updateSettings: (partial: Partial<CaptionViewerSettings>) => void;
  resetSettings: () => void;
};

export const useCaptionViewerSettings = (): UseCaptionViewerSettingsResult => {
  const [settings, setSettingsState] = useState<CaptionViewerSettings>(
    DEFAULT_CAPTION_VIEWER_SETTINGS
  );
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAPTION_VIEWER_SETTINGS_STORAGE_KEY);
      if (!raw) return;
      setSettingsState(sanitizeCaptionViewerSettings(JSON.parse(raw)));
    } catch (_e) {
      // Ignore malformed JSON or storage errors
    } finally {
      setHasRestoredFromStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredFromStorage) return;
    try {
      localStorage.setItem(
        CAPTION_VIEWER_SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );
    } catch (_e) {
      // Ignore storage write errors (quota, privacy mode, etc.)
    }
  }, [settings, hasRestoredFromStorage]);

  const setSettings = useMemo(() => {
    return (next: CaptionViewerSettings) =>
      setSettingsState(sanitizeCaptionViewerSettings(next));
  }, []);

  const updateSettings = useMemo(() => {
    return (partial: Partial<CaptionViewerSettings>) => {
      setSettingsState((prev) =>
        sanitizeCaptionViewerSettings({ ...prev, ...partial })
      );
    };
  }, []);

  const resetSettings = useMemo(() => {
    return () => setSettingsState(DEFAULT_CAPTION_VIEWER_SETTINGS);
  }, []);

  return { settings, setSettings, updateSettings, resetSettings };
};
