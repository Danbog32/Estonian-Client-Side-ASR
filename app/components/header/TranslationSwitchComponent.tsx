"use client";

import { Button, cn, Link } from "@heroui/react";
import { useSettings } from "../../providers/SettingsContext";
import { Icons } from "../icons";

export default function TranslationSwitchComponent() {
  const { language } = useSettings();

  const translations = {
    en: {
      new: "NEW",
      title: "Translation Feature Moved",
      description:
        "Try the Live Estonian → English translation feature on our new dedicated website",
      visitWebsite: "Visit est2eng.vercel.app",
      newTab: "Opens in new tab",
    },
    et: {
      new: "UUS",
      title: "Tõlkefunktsioon on teisaldatud",
      description:
        "Proovi eesti → inglise tõlkefunktsiooni meie uuel spetsiaalsel veebilehel",
      visitWebsite: "Külasta est2eng.vercel.app",
      newTab: "Avab uues vahelehes",
    },
  };

  const t =
    translations[language as keyof typeof translations] || translations.en;

  return (
    <div className="w-full flex flex-col gap-2 bg-gray-900 rounded-lg p-4 border-2 border-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1 flex-1">
          <p className="text-medium text-white flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Icons.languages size={16} color="white" />
              {t.new}
            </span>
            {t.title}
          </p>
          <p className="text-tiny text-white">{t.description}</p>
        </div>
        <div className="flex-shrink-0"></div>
      </div>
      <Button
        as={Link}
        isExternal
        href="https://est2eng.vercel.app"
        target="_blank"
        size="sm"
        className="bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors duration-200 gap-1"
      >
        <Icons.link size={16} color="white" />
        {t.visitWebsite}
      </Button>
    </div>
  );
}
