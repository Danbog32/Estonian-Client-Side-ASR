"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Slider,
} from "@heroui/react";
import { Icons } from "../icons";
import { useSettings } from "../../providers/SettingsContext";
import type { CaptionViewerSettings } from "./captionViewerSettings";

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: CaptionViewerSettings;
  onChange: (next: CaptionViewerSettings) => void;
  onReset: () => void;
};

const colorPresets = [
  // Light presets
  {
    key: "blackOnWhite",
    textColor: "#000000",
    backgroundColor: "#FFFFFF",
    label: { en: "Black on white", et: "Must valgel" },
  },
  {
    key: "darkBrownOnCream",
    textColor: "#3E2723",
    backgroundColor: "#FFF8E1",
    label: { en: "Warm sepia", et: "Soe sepia" },
  },
  {
    key: "darkBlueOnLightBlue",
    textColor: "#0D47A1",
    backgroundColor: "#E3F2FD",
    label: { en: "Blue theme", et: "Sinine teema" },
  },
  // Dark presets
  {
    key: "whiteOnBlack",
    textColor: "#FFFFFF",
    backgroundColor: "#000000",
    label: { en: "White on black", et: "Valge mustal" },
  },
  {
    key: "amberOnCharcoal",
    textColor: "#FFB347",
    backgroundColor: "#1A1A1A",
    label: { en: "Amber on charcoal", et: "Merevaik söehallil" },
  },
  {
    key: "blueOnGraphite",
    textColor: "#E0F0FF",
    backgroundColor: "#0F1216",
    label: { en: "Blue on graphite", et: "Sinine grafiidil" },
  },
] as const;

export default function CaptionViewerSettingsDrawer({
  isOpen,
  onOpenChange,
  settings,
  onChange,
  onReset,
}: Props) {
  const { language } = useSettings() as { language: "en" | "et" };
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const fontSizeMin = isMobile ? 14 : 18;
  const fontSizeMax = isMobile ? 56 : 96;

  const translations = {
    en: {
      title: "Display settings",
      subtitle: "Customize your viewing experience",
      typographyDesc: "Adjust font size and spacing",
      viewMode: "View mode",
      viewModeCaptions: "Captions",
      viewModeTranscript: "Transcript",
      viewModeCaptionsDesc: "All text",
      viewModeTranscriptDesc: "Full text",
      typography: "Typography",
      fontSize: "Font size",
      lineHeight: "Line height",
      fontWeight: "Font weight",
      letterSpacing: "Letter spacing",
      regular: "Regular",
      regularDesc: "Normal thickness",
      semibold: "Semibold",
      semiboldDesc: "Slightly bolder",
      colors: "Colors",
      colorsDesc: "Choose your preferred color scheme",
      textColor: "Text",
      backgroundColor: "Background",
      presets: "Presets",
      layout: "Layout",
      layoutDesc: "Configure alignment and view mode",
      alignment: "Alignment",
      full: "Edge to edge",
      fullDesc: "Full width",
      left: "Left aligned",
      leftDesc: "Align left",
      center: "Centered",
      centerDesc: "Align center",
      right: "Right aligned",
      rightDesc: "Align right",
      reset: "Reset defaults",
      close: "Close",
    },
    et: {
      title: "Kuva seaded",
      subtitle: "Kohanda oma vaatamiskogemust",
      typographyDesc: "Muuda suurust ja reavahet",
      viewMode: "Kuvarežiim",
      viewModeCaptions: "Subtiitrid",
      viewModeTranscript: "Transkript",
      viewModeCaptionsDesc: "Kogu tekst",
      viewModeTranscriptDesc: "Kogu tekst",
      typography: "Kirjastiil",
      fontSize: "Kirja suurus",
      lineHeight: "Reavahe",
      fontWeight: "Kirja paksus",
      letterSpacing: "Tähevahe",
      regular: "Tavaline",
      regularDesc: "Normaalne paksus",
      semibold: "Poolpaks",
      semiboldDesc: "Veidi paksem",
      colors: "Värvid",
      colorsDesc: "Vali eelistatud värviskeemi",
      textColor: "Tekst",
      backgroundColor: "Taust",
      presets: "Eelseaded",
      layout: "Paigutus",
      layoutDesc: "Seadista teksti joondus ja kuvarežiim",
      alignment: "Joondus",
      full: "Servast servani",
      fullDesc: "Täislaius",
      left: "Vasakule joondatud",
      leftDesc: "Vasakule",
      center: "Keskel",
      centerDesc: "Keskele",
      right: "Paremale joondatud",
      rightDesc: "Paremale",
      reset: "Lähtesta vaikeväärtused",
      close: "Sulge",
    },
  } as const;

  const t = translations[language] ?? translations.en;

  const fontWeightOptions = useMemo(() => {
    return [
      { label: t.regular, value: 400 as const, description: t.regularDesc },
      { label: t.semibold, value: 600 as const, description: t.semiboldDesc },
    ];
  }, [t.regular, t.regularDesc, t.semibold, t.semiboldDesc]);

  const alignmentOptions = useMemo(() => {
    return [
      {
        value: "full" as const,
        label: t.full,
        description: t.fullDesc,
        Icon: Icons.arrowLeftRight,
      },
      {
        value: "left" as const,
        label: t.left,
        description: t.leftDesc,
        Icon: Icons.alignLeft,
      },
      {
        value: "center" as const,
        label: t.center,
        description: t.centerDesc,
        Icon: Icons.alignCenter,
      },
      {
        value: "right" as const,
        label: t.right,
        description: t.rightDesc,
        Icon: Icons.alignRight,
      },
    ];
  }, [
    t.center,
    t.centerDesc,
    t.full,
    t.fullDesc,
    t.left,
    t.leftDesc,
    t.right,
    t.rightDesc,
  ]);

  return (
    <Drawer placement="right" isOpen={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-gradient-to-br from-[rgba(20,20,24,0.97)] to-[rgba(26,26,30,0.97)] border-l border-white/10 shadow-[-4px_0_24px_rgba(0,0,0,0.5)] backdrop-blur-[20px] text-white/95">
        {(onClose) => (
          <>
            <DrawerHeader className="px-6 pt-6 pb-5 flex justify-between items-start border-b border-white/6 bg-gradient-to-b from-white/[0.03] to-transparent">
              <div className="flex flex-col gap-1">
                <span className="text-[1.6rem] font-extrabold tracking-[-0.02em] bg-gradient-to-br from-white to-white/85 bg-clip-text text-transparent">
                  {t.title}
                </span>
                <span className="text-sm text-white/55 font-normal">
                  {t.subtitle}
                </span>
              </div>
              {/* <button
                type="button"
                className="w-9 h-9 grid place-items-center rounded-[10px] text-white/70 transition-all duration-200 bg-transparent border border-transparent hover:bg-white/8 hover:text-white/95 focus-visible:outline-2 focus-visible:outline-[rgba(95,163,255,0.9)] focus-visible:outline-offset-2"
                onClick={onClose}
                aria-label={t.close}
              >
                <Icons.close className="w-5 h-5" />
              </button> */}
            </DrawerHeader>

            <DrawerBody className="p-6 overflow-y-auto flex flex-col gap-0 md:p-5">
              <section className="flex flex-col gap-[1.125rem] pb-6 md:pb-5">
                <div className="flex gap-2.5 items-start">
                  <div className="grid place-items-center flex-shrink-0">
                    <Icons.textSelect className="w-[22px] h-[22px] opacity-90" />
                  </div>
                  <div>
                    <h2 className="text-base font-[650] tracking-[-0.01em] m-0 leading-[1.3]">
                      {t.typography}
                    </h2>
                    <p className="text-[0.85rem] text-white/55 mt-1 leading-[1.4] m-0">
                      {t.typographyDesc}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <Slider
                    size="md"
                    label={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Icons.type className="w-6 h-6 opacity-70 text-white/70 flex-shrink-0" />
                          <span className="text-sm font-[550] text-white/75 tracking-[-0.005em]">
                            {t.fontSize}
                          </span>
                        </div>
                      </div>
                    }
                    step={1}
                    color="primary"
                    maxValue={fontSizeMax}
                    minValue={fontSizeMin}
                    value={settings.fontSizePx}
                    onChange={(value) => {
                      const next = Array.isArray(value) ? value[0] : value;
                      onChange({ ...settings, fontSizePx: next });
                    }}
                  />

                  <Slider
                    size="md"
                    label={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <Icons.type className="w-6 h-6 opacity-70 text-white/70 flex-shrink-0 border-y-1 border-white/70" />
                          </div>
                          <span className="text-sm font-[550] text-white/75 tracking-[-0.005em]">
                            {t.lineHeight}
                          </span>
                        </div>
                      </div>
                    }
                    step={0.05}
                    color="primary"
                    maxValue={3}
                    minValue={1}
                    value={settings.lineHeight}
                    onChange={(value) => {
                      const next = Array.isArray(value) ? value[0] : value;
                      onChange({ ...settings, lineHeight: next });
                    }}
                  />

                  <Slider
                    size="md"
                    label={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Icons.type className="w-6 h-6 opacity-70 text-white/70 flex-shrink-0 border-x-1 border-white/70" />
                          </div>
                          <span className="text-sm font-[550] text-white/75 tracking-[-0.005em]">
                            {t.letterSpacing}
                          </span>
                        </div>
                      </div>
                    }
                    step={0.005}
                    color="primary"
                    maxValue={0.2}
                    minValue={0}
                    value={settings.letterSpacingEm}
                    onChange={(value) => {
                      const next = Array.isArray(value) ? value[0] : value;
                      onChange({ ...settings, letterSpacingEm: next });
                    }}
                  />

                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-3">
                      {fontWeightOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex flex-col items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-[14px] border-[1.5px] transition-all duration-[250ms] cursor-pointer min-h-[75px] ${
                            settings.fontWeight === option.value
                              ? "border-[rgba(74,144,226,0.95)] bg-gradient-to-br from-[rgba(74,144,226,0.15)] to-[rgba(74,144,226,0.08)] shadow-[0_0_0_1px_rgba(74,144,226,0.2)]"
                              : "border-white/10 bg-white/[0.02] hover:border-[rgba(74,144,226,0.4)] hover:bg-white/[0.05] hover:-translate-y-px"
                          }`}
                          aria-pressed={settings.fontWeight === option.value}
                          onClick={() =>
                            onChange({ ...settings, fontWeight: option.value })
                          }
                        >
                          <div
                            className={`text-xl text-white/95 transition-transform duration-200 ${
                              settings.fontWeight === option.value
                                ? "scale-110"
                                : ""
                            }`}
                            style={{ fontWeight: option.value }}
                          >
                            Aa
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className="text-[0.85rem] text-white/95"
                              style={{
                                fontWeight: option.value === 400 ? 400 : 600,
                              }}
                            >
                              {option.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-gradient-to-r from-transparent via-white/8 [20%] via-white/8 [80%] to-transparent" />

              <section className="flex flex-col gap-[1.125rem] pb-6 md:pb-5">
                <div className="flex gap-2.5 items-start">
                  <div className="grid place-items-center flex-shrink-0">
                    <Icons.palette className="w-[22px] h-[22px] opacity-90" />
                  </div>
                  <div>
                    <h2 className="text-base font-[650] tracking-[-0.01em] m-0 leading-[1.3]">
                      {t.colors}
                    </h2>
                    <p className="text-[0.85rem] text-white/55 mt-1 leading-[1.4] m-0">
                      {t.colorsDesc}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex gap-4">
                    <label className="flex flex-col items-center gap-2 flex-1 cursor-pointer">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.05em]">
                        {t.textColor}
                      </span>
                      <div
                        className="w-full h-14 rounded-[14px] border-2 border-white/15 relative cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:border-[rgba(74,144,226,0.5)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                        style={{ backgroundColor: settings.textColor }}
                      >
                        <input
                          type="color"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          value={settings.textColor}
                          onChange={(event) =>
                            onChange({
                              ...settings,
                              textColor: event.currentTarget.value,
                            })
                          }
                          aria-label={t.textColor}
                        />
                      </div>
                      <span className="text-[0.7rem] font-mono text-white/55 uppercase">
                        {settings.textColor}
                      </span>
                    </label>

                    <label className="flex flex-col items-center gap-2 flex-1 cursor-pointer">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.05em]">
                        {t.backgroundColor}
                      </span>
                      <div
                        className="w-full h-14 rounded-[14px] border-2 border-white/15 relative cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:border-[rgba(74,144,226,0.5)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                        style={{ backgroundColor: settings.backgroundColor }}
                      >
                        <input
                          type="color"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          value={settings.backgroundColor}
                          onChange={(event) =>
                            onChange({
                              ...settings,
                              backgroundColor: event.currentTarget.value,
                            })
                          }
                          aria-label={t.backgroundColor}
                        />
                      </div>
                      <span className="text-[0.7rem] font-mono text-white/55 uppercase">
                        {settings.backgroundColor}
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-[550] text-white/75 tracking-[-0.005em]">
                      {t.presets}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          className="flex flex-col gap-1.5 p-0 border-[1.5px] border-white/10 rounded-[14px] bg-white/[0.03] transition-all duration-[250ms] cursor-pointer overflow-hidden hover:border-[rgba(74,144,226,0.4)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                          onClick={() =>
                            onChange({
                              ...settings,
                              textColor: preset.textColor,
                              backgroundColor: preset.backgroundColor,
                            })
                          }
                          aria-label={preset.label[language] ?? preset.label.en}
                        >
                          <div
                            className="w-full h-[58px] grid place-items-center text-[1.75rem] font-[750] transition-all duration-200 hover:scale-[1.03]"
                            style={{
                              backgroundColor: preset.backgroundColor,
                              color: preset.textColor,
                            }}
                          >
                            Aa
                          </div>
                          <div className="text-[0.85rem] text-white/80 text-center py-[0.5rem] px-2 pb-2.5 font-[650]">
                            {preset.label[language] ?? preset.label.en}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-gradient-to-r from-transparent via-white/8 [20%] via-white/8 [80%] to-transparent" />

              <section className="flex flex-col gap-[1.125rem] pb-6 md:pb-5">
                <div className="flex gap-2.5 items-start">
                  <div className="grid place-items-center flex-shrink-0">
                    <Icons.cog className="w-[22px] h-[22px] opacity-90" />
                  </div>
                  <div>
                    <h2 className="text-base font-[650] tracking-[-0.01em] m-0 leading-[1.3]">
                      {t.layout}
                    </h2>
                    <p className="text-[0.85rem] text-white/55 mt-1 leading-[1.4] m-0">
                      {t.layoutDesc}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-[550] text-white/75 tracking-[-0.005em]">
                      {t.alignment}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {alignmentOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2.5 rounded-[14px] border-[1.5px] transition-all duration-[250ms] cursor-pointer min-h-[85px] md:min-h-[70px] ${
                            settings.horizontalAlignment === option.value
                              ? "border-[rgba(74,144,226,0.95)] bg-gradient-to-br from-[rgba(74,144,226,0.15)] to-[rgba(74,144,226,0.08)] shadow-[0_0_0_1px_rgba(74,144,226,0.2)]"
                              : "border-white/10 bg-white/[0.02] hover:border-[rgba(74,144,226,0.4)] hover:bg-white/[0.05] hover:-translate-y-px"
                          }`}
                          aria-pressed={
                            settings.horizontalAlignment === option.value
                          }
                          onClick={() =>
                            onChange({
                              ...settings,
                              horizontalAlignment: option.value,
                            })
                          }
                        >
                          <option.Icon className="w-5 h-5 opacity-95" />
                          <div className="text-xs text-center text-white/65">
                            {option.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 h-[50px] rounded-2xl border-[1.5px] border-white/15 bg-white/[0.02] text-white/90 font-bold text-[1.05rem] transition-all duration-[250ms] cursor-pointer mt-4 hover:border-[rgba(74,144,226,0.5)] hover:bg-[rgba(74,144,226,0.1)] hover:text-[#5fa3ff] focus-visible:border-[rgba(74,144,226,0.5)] focus-visible:bg-[rgba(74,144,226,0.1)] focus-visible:text-[#5fa3ff]"
                  onClick={onReset}
                >
                  <Icons.rotateCcw className="w-5 h-5" />
                  {t.reset}
                </button>
              </section>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
