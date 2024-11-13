// components/AudioSection.tsx

"use client";

import { useSettings } from "./SettingsContext";

interface AudioSectionProps {
  showSoundClips: boolean;
}

const AudioSection: React.FC<AudioSectionProps> = ({ showSoundClips }) => {
  const { language } = useSettings() as { language: "en" | "et" };

  const translations = {
    en: {
      recentSoundClips: "Recent sound clips",
    },
    et: {
      recentSoundClips: "Hiljutised heliklipid",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      {showSoundClips && (
        <div>
          <span id="hint" className="block text-lg text-gray-300">
            {t.recentSoundClips}
          </span>
          <section
            id="sound-clips"
            className="w-full bg-gray-800 mt-1"
            style={{ flex: 1, overflow: "auto" }}
          ></section>
        </div>
      )}
    </>
  );
};

export default AudioSection;
