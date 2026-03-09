"use client";

import React, { useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { TalTechLogo } from "./TalTechLogo.jsx";
import { Icons } from "../icons";
import { useSettings } from "../../providers/SettingsContext";
import CaptionViewerSettingsDrawer from "../viewer/CaptionViewerSettingsDrawer";
import AdvancedSettingsMenu from "./AdvancedSettingsMenu";

export default function AppNavbar() {
  const [isRecording, setIsRecording] = useState(false);
  const { isOpen, onOpenChange } = useDisclosure();

  const {
    language,
    setLanguage,
    subtitleMode,
    setSubtitleMode,
    displaySettings,
    setDisplaySettings,
    resetDisplaySettings,
  } = useSettings();

  const translations = {
    en: {
      start: "Start",
      stop: "Stop",
      clear: "Clear",
      settings: "Settings",
      advanced: "Advanced",
      language: "Language",
      subtitleMode: "Subtitle mode",
      textMode: "Text",
      subtitleModeBtn: "Subtitles",
    },
    et: {
      start: "Alusta",
      stop: "Peata",
      clear: "Puhasta",
      settings: "Seaded",
      advanced: "Täiendav",
      language: "Keel",
      subtitleMode: "Subtiitrite režiim",
      textMode: "Tekst",
      subtitleModeBtn: "Subtiitrid",
    },
  };

  const t = translations[language] || translations.en;

  const handleButtonClick = () => {
    setIsRecording(!isRecording);
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");

    if (isRecording) {
      stopBtn?.click();
    } else {
      startBtn?.click();
    }
  };

  const handleModeChange = (mode: "text" | "subtitle") => {
    setSubtitleMode(mode === "subtitle");
    const win = window as unknown as Record<string, unknown>;
    if (typeof win.setSubtitleMode === "function") {
      (win.setSubtitleMode as (v: boolean) => void)(mode === "subtitle");
    }
  };

  const languageAndModeSection = (
    <div className="flex flex-col gap-4">
      {/* Language toggle */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Icons.languages className="w-[18px] h-[18px] opacity-90" />
          <span className="text-sm font-[550] text-white/75 tracking-[-0.005em]">
            {t.language}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["en", "et"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-[14px] border-[1.5px] transition-all duration-[250ms] cursor-pointer ${
                language === lang
                  ? "border-[rgba(74,144,226,0.95)] bg-gradient-to-br from-[rgba(74,144,226,0.15)] to-[rgba(74,144,226,0.08)] shadow-[0_0_0_1px_rgba(74,144,226,0.2)]"
                  : "border-white/10 bg-white/[0.02] hover:border-[rgba(74,144,226,0.4)] hover:bg-white/[0.05] hover:-translate-y-px"
              }`}
              aria-pressed={language === lang}
              onClick={() => setLanguage(lang)}
            >
              <span className="text-[0.9rem] font-[600] text-white/95">
                {lang === "en" ? "English" : "Eesti"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subtitle mode toggle */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Icons.wholeWord className="w-[18px] h-[18px] opacity-90" />
          <span className="text-sm font-[550] text-white/75 tracking-[-0.005em]">
            {t.subtitleMode}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-[14px] border-[1.5px] transition-all duration-[250ms] cursor-pointer ${
              !subtitleMode
                ? "border-[rgba(74,144,226,0.95)] bg-gradient-to-br from-[rgba(74,144,226,0.15)] to-[rgba(74,144,226,0.08)] shadow-[0_0_0_1px_rgba(74,144,226,0.2)]"
                : "border-white/10 bg-white/[0.02] hover:border-[rgba(74,144,226,0.4)] hover:bg-white/[0.05] hover:-translate-y-px"
            }`}
            aria-pressed={!subtitleMode}
            onClick={() => handleModeChange("text")}
          >
            <span className="text-[0.9rem] font-[600] text-white/95">
              {t.textMode}
            </span>
          </button>
          <button
            type="button"
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-[14px] border-[1.5px] transition-all duration-[250ms] cursor-pointer ${
              subtitleMode
                ? "border-[rgba(74,144,226,0.95)] bg-gradient-to-br from-[rgba(74,144,226,0.15)] to-[rgba(74,144,226,0.08)] shadow-[0_0_0_1px_rgba(74,144,226,0.2)]"
                : "border-white/10 bg-white/[0.02] hover:border-[rgba(74,144,226,0.4)] hover:bg-white/[0.05] hover:-translate-y-px"
            }`}
            aria-pressed={subtitleMode}
            onClick={() => handleModeChange("subtitle")}
          >
            <span className="text-[0.9rem] font-[600] text-white/95">
              {t.subtitleModeBtn}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar className="bg-gray-900 bg-opacity-85">
        <NavbarContent justify="start">
          <NavbarBrand>
            <Link
              href="https://taltech.ee/en/laboratory-language-technology"
              target="_blank"
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              <TalTechLogo />
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <button
              id="startBtn"
              disabled
              className="bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-medium px-4 py-2 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
            >
              <Icons.mic size={20} />
              {t.start}
            </button>
          </NavbarItem>
          <NavbarItem>
            <button
              id="stopBtn"
              disabled
              className="bg-danger hover:bg-danger/90 active:bg-danger/80 text-white font-medium px-4 py-2 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
            >
              <Icons.stop size={20} />
              {t.stop}
            </button>
          </NavbarItem>
          <NavbarItem>
            <button
              id="clearBtn"
              className="bg-default-100 hover:bg-default-200 active:bg-default-300 text-default-700 dark:text-default-500 font-medium px-4 py-2 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
            >
              <Icons.trash size={18} />
              {t.clear}
            </button>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent className="flex sm:hidden" justify="center">
          <NavbarItem>
            <button
              id="toggleBtn"
              onClick={handleButtonClick}
              className={`${
                isRecording
                  ? "bg-danger hover:bg-danger/90"
                  : "bg-primary hover:bg-primary/90"
              } text-white font-medium px-4 py-2 rounded-xl transition-all duration-150 flex items-center gap-2`}
            >
              <Icons.mic size={18} />
              {isRecording ? t.stop : t.start}
            </button>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent justify="end" className="gap-1">
          <NavbarItem>
            <Button
              variant="bordered"
              onPress={() => onOpenChange()}
              color="default"
              className="text-white bg-gray-900 hover:bg-gray-800 transition duration-100 gap-1 min-w-0"
            >
              <Icons.settings size={20} color="white" />
              <span className="hidden sm:inline">{t.settings}</span>
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Popover placement="bottom-end">
              <PopoverTrigger>
                <Button
                  variant="bordered"
                  isIconOnly
                  className="text-white bg-gray-900 hover:bg-gray-800 transition duration-100 min-w-0"
                  aria-label={t.advanced}
                >
                  <Icons.ellipsisVertical size={20} color="white" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-gray-800 border border-gray-700 p-0 w-[320px] max-h-[80vh] overflow-auto">
                <AdvancedSettingsMenu />
              </PopoverContent>
            </Popover>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <CaptionViewerSettingsDrawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        settings={displaySettings}
        onChange={setDisplaySettings}
        onReset={resetDisplaySettings}
        extraSections={languageAndModeSection}
      />
    </>
  );
}
