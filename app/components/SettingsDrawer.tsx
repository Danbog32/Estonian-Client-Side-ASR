"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useSettings, COLOR_PRESETS } from "../providers/SettingsContext";
import TranslationSwitchComponent from "./header/TranslationSwitchComponent";
import ZoomApiSwitchComponent from "./header/ZoomApiSwitchComponent";
import FirebaseApiSwitchComponent from "./header/FirebaseApiSwitchComponent";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const {
    textSize,
    setTextSize,
    lineHeight,
    setLineHeight,
    textColor,
    setTextColor,
    backgroundColor,
    setBackgroundColor,
    language,
    setLanguage,
  } = useSettings() as {
    textSize: number;
    setTextSize: (v: number) => void;
    lineHeight: number;
    setLineHeight: (v: number) => void;
    textColor: string;
    setTextColor: (v: string) => void;
    backgroundColor: string;
    setBackgroundColor: (v: string) => void;
    language: "en" | "et";
    setLanguage: (v: string) => void;
  };

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const translations = {
    en: {
      settings: "Settings",
      subtitle: "Customize your experience",
      fontSize: "Font size",
      lineHeight: "Line height",
      presets: "Color presets",
      language: "Language",
      advanced: "Advanced",
      advancedDesc: "Translation, Firebase, Zoom",
      about: "About",
      aboutText:
        "Estonian speech-to-text by TalTech Language Technology Lab. Free, no login required. Runs entirely in your browser.",
      author: "Author: Bohdan Podziubanchuk",
      close: "Close",
      blackOnWhite: "Black / White",
      whiteOnBlack: "White / Black",
      yellowOnBlack: "Yellow / Black",
      cyanOnDark: "Cyan / Dark",
      amberOnCharcoal: "Amber / Charcoal",
      blueOnGraphite: "Blue / Graphite",
    },
    et: {
      settings: "Seaded",
      subtitle: "Kohanda oma kogemust",
      fontSize: "Teksti suurus",
      lineHeight: "Reavahe",
      presets: "Värvi eelseaded",
      language: "Keel",
      advanced: "Täiendavad seaded",
      advancedDesc: "Tõlge, Firebase, Zoom",
      about: "Rakenduse teave",
      aboutText:
        "Eesti kõnetuvastus TalTech keeletehnoloogia labori poolt. Tasuta, ilma sisselogimiseta. Töötab täielikult brauseris.",
      author: "Autor: Bohdan Podziubanchuk",
      close: "Sulge",
      blackOnWhite: "Must / Valge",
      whiteOnBlack: "Valge / Must",
      yellowOnBlack: "Kollane / Must",
      cyanOnDark: "Tsüaan / Tume",
      amberOnCharcoal: "Merevaik / Söe",
      blueOnGraphite: "Sinine / Grafiit",
    },
  };

  const t = translations[language] || translations.en;

  const presetLabels: Record<string, string> = {
    blackOnWhite: t.blackOnWhite,
    whiteOnBlack: t.whiteOnBlack,
    yellowOnBlack: t.yellowOnBlack,
    cyanOnDark: t.cyanOnDark,
    amberOnCharcoal: t.amberOnCharcoal,
    blueOnGraphite: t.blueOnGraphite,
  };

  const applyPreset = (preset: (typeof COLOR_PRESETS)[number]) => {
    setTextColor(preset.textColor);
    setBackgroundColor(preset.backgroundColor);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-dvh z-50 flex flex-col
          w-[min(380px,90vw)]
          bg-gradient-to-br from-[rgba(20,20,24,0.97)] to-[rgba(26,26,30,0.97)]
          backdrop-blur-xl border-r border-white/10
          shadow-[4px_0_24px_rgba(0,0,0,0.5)]
          transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label={t.settings}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-bold text-white">{t.settings}</h2>
            <p className="text-sm text-white/50 mt-0.5">{t.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-lg text-white/70 hover:bg-white/[0.08] hover:text-white/95 transition-all"
            aria-label={t.close}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Font size */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-white/75">
                {t.fontSize}
              </span>
              <span className="text-xs font-semibold bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/25">
                {textSize}rem
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              step={0.5}
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
              className="settings-slider w-full"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>1</span>
              <span>8</span>
            </div>
          </section>

          {/* Line height */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-white/75">
                {t.lineHeight}
              </span>
              <span className="text-xs font-semibold bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/25">
                {lineHeight}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.2}
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="settings-slider w-full"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>1</span>
              <span>3</span>
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          {/* Color presets */}
          <section>
            <span className="text-sm font-medium text-white/75 block mb-3">
              {t.presets}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isActive =
                  textColor === preset.textColor &&
                  backgroundColor === preset.backgroundColor;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={`
                      flex flex-col rounded-lg border overflow-hidden transition-all
                      ${
                        isActive
                          ? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                          : "border-white/10 hover:border-blue-500/40 hover:-translate-y-0.5"
                      }
                    `}
                    aria-label={presetLabels[preset.name]}
                  >
                    <div
                      className="w-full h-[52px] grid place-items-center text-2xl font-semibold"
                      style={{
                        backgroundColor: preset.backgroundColor,
                        color: preset.textColor,
                      }}
                    >
                      Aa
                    </div>
                    <span className="text-[10px] text-white/70 text-center py-1.5 px-1 font-medium">
                      {presetLabels[preset.name]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          {/* Language */}
          <section>
            <span className="text-sm font-medium text-white/75 block mb-3">
              {t.language}
            </span>
            <div className="flex gap-2">
              {(["et", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  className={`
                    flex-1 py-3 rounded-lg text-sm font-semibold transition-all border
                    ${
                      language === lang
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-white/[0.02] border-white/10 text-white/60 hover:border-white/25"
                    }
                  `}
                >
                  {lang === "et" ? "Eesti" : "English"}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          {/* Advanced (collapsible) */}
          <section>
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center justify-between w-full text-left py-2"
              aria-expanded={advancedOpen}
            >
              <div>
                <span className="text-sm font-medium text-white/75 block">
                  {t.advanced}
                </span>
                <span className="text-xs text-white/40">
                  {t.advancedDesc}
                </span>
              </div>
              {advancedOpen ? (
                <ChevronDown size={18} className="text-white/50 shrink-0" />
              ) : (
                <ChevronRight size={18} className="text-white/50 shrink-0" />
              )}
            </button>

            {advancedOpen && (
              <div className="mt-3 space-y-3">
                <TranslationSwitchComponent />
                <ZoomApiSwitchComponent />
                <FirebaseApiSwitchComponent />
              </div>
            )}
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          {/* About */}
          <section className="pb-4">
            <span className="text-sm font-medium text-white/75 block mb-2">
              {t.about}
            </span>
            <p className="text-xs text-white/50 leading-relaxed">
              {t.aboutText}
            </p>
            <p className="text-xs text-white/40 mt-2">{t.author}</p>
            <a
              href="https://taltech.ee/en/laboratory-language-technology"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors"
            >
              TalTech Language Technology Lab
              <ExternalLink size={12} />
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
