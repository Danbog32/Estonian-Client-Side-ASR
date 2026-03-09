"use client";

import { useSettings } from "../../providers/SettingsContext";
import { Icons } from "../icons";
import TranslationSwitchComponent from "./TranslationSwitchComponent";
import ZoomApiSwitchComponent from "./ZoomApiSwitchComponent";
import FirebaseApiSwitchComponent from "./FirebaseApiSwitchComponent";

export default function AdvancedSettingsMenu() {
  const { language } = useSettings();

  const translations = {
    en: { title: "Advanced Settings" },
    et: { title: "Täiendavad seaded" },
  };

  const t = translations[language] ?? translations.en;

  return (
    <div className="flex flex-col gap-3 p-4 text-white">
      <div className="flex gap-2 items-center">
        <Icons.cloud size={18} className="text-white/70" />
        <span className="text-sm font-semibold text-white/90">{t.title}</span>
      </div>
      <ZoomApiSwitchComponent />
      <FirebaseApiSwitchComponent />
    </div>
  );
}
