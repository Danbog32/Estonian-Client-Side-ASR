"use client";

import { useEffect, useMemo, useState } from "react";
import { useSettings } from "../../providers/SettingsContext";
import { Icons } from "../icons";
import {
  SettingsColorInput,
  SettingsDrawerShell,
  SettingsPresetGrid,
  SettingsSection,
  SettingsSliderField,
} from "../settings/SettingsDrawerPrimitives";
import { SHARED_COLOR_PRESETS } from "../settings/sharedColorPresets";
import type { CaptionViewerSettings } from "./captionViewerSettings";

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: CaptionViewerSettings;
  onChange: (next: CaptionViewerSettings) => void;
  onReset: () => void;
};

const optionButtonClassName = (isActive: boolean) =>
  `flex min-h-[78px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] px-2.5 py-3 text-center transition-all duration-[250ms] ${
    isActive
      ? "border-[rgba(74,144,226,0.95)] bg-gradient-to-br from-[rgba(74,144,226,0.15)] to-[rgba(74,144,226,0.08)] shadow-[0_0_0_1px_rgba(74,144,226,0.2)]"
      : "border-white/10 bg-white/[0.02] hover:-translate-y-px hover:border-[rgba(74,144,226,0.4)] hover:bg-white/[0.05]"
  }`;

export default function CaptionViewerSettingsDrawer({
  isOpen,
  onOpenChange,
  settings,
  onChange,
  onReset,
}: Props) {
  const { language } = useSettings();
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
      typography: "Typography",
      typographyDesc: "Adjust size, spacing and weight",
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
      layoutDesc: "Configure caption alignment",
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
      typography: "Kirjastiil",
      typographyDesc: "Muuda suurust, vahet ja paksust",
      fontSize: "Kirja suurus",
      lineHeight: "Reavahe",
      fontWeight: "Kirja paksus",
      letterSpacing: "Tähevahe",
      regular: "Tavaline",
      regularDesc: "Normaalne paksus",
      semibold: "Poolpaks",
      semiboldDesc: "Veidi paksem",
      colors: "Värvid",
      colorsDesc: "Vali eelistatud värviskeem",
      textColor: "Tekst",
      backgroundColor: "Taust",
      presets: "Eelseaded",
      layout: "Paigutus",
      layoutDesc: "Seadista subtiitrite joondus",
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
    <SettingsDrawerShell
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t.title}
      subtitle={t.subtitle}
      closeLabel={t.close}
      placement="right"
    >
      <SettingsSection
        icon={Icons.textSelect}
        title={t.typography}
        description={t.typographyDesc}
      >
        <div className="flex flex-col gap-5">
          <SettingsSliderField
            icon={Icons.type}
            label={t.fontSize}
            valueLabel={`${settings.fontSizePx}px`}
            minValue={fontSizeMin}
            maxValue={fontSizeMax}
            step={1}
            value={settings.fontSizePx}
            onChange={(value) => onChange({ ...settings, fontSizePx: value })}
            minLabel={`${fontSizeMin}`}
            maxLabel={`${fontSizeMax}`}
          />

          <SettingsSliderField
            icon={Icons.gripVertical}
            label={t.lineHeight}
            valueLabel={settings.lineHeight.toFixed(2)}
            minValue={1}
            maxValue={3}
            step={0.05}
            value={settings.lineHeight}
            onChange={(value) => onChange({ ...settings, lineHeight: value })}
            minLabel="1"
            maxLabel="3"
          />

          <SettingsSliderField
            icon={Icons.type}
            label={t.letterSpacing}
            valueLabel={`${settings.letterSpacingEm.toFixed(3)}em`}
            minValue={0}
            maxValue={0.2}
            step={0.005}
            value={settings.letterSpacingEm}
            onChange={(value) =>
              onChange({ ...settings, letterSpacingEm: value })
            }
            minLabel="0"
            maxLabel="0.2"
          />

          <div className="flex flex-col gap-2">
            <div className="text-sm font-[550] tracking-[-0.005em] text-white/75">
              {t.fontWeight}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fontWeightOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={optionButtonClassName(
                    settings.fontWeight === option.value
                  )}
                  aria-pressed={settings.fontWeight === option.value}
                  onClick={() =>
                    onChange({ ...settings, fontWeight: option.value })
                  }
                >
                  <div
                    className={`text-xl text-white/95 transition-transform duration-200 ${
                      settings.fontWeight === option.value ? "scale-110" : ""
                    }`}
                    style={{ fontWeight: option.value }}
                  >
                    Aa
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className="text-[0.85rem] text-white/95"
                      style={{ fontWeight: option.value }}
                    >
                      {option.label}
                    </span>
                    <span className="text-xs text-white/55">
                      {option.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Icons.palette}
        title={t.colors}
        description={t.colorsDesc}
      >
        <div className="flex flex-col gap-5">
          <div className="flex gap-4">
            <SettingsColorInput
              label={t.textColor}
              value={settings.textColor}
              onChange={(value) => onChange({ ...settings, textColor: value })}
            />
            <SettingsColorInput
              label={t.backgroundColor}
              value={settings.backgroundColor}
              onChange={(value) =>
                onChange({ ...settings, backgroundColor: value })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm font-[550] tracking-[-0.005em] text-white/75">
              {t.presets}
            </div>
            <SettingsPresetGrid
              presets={SHARED_COLOR_PRESETS}
              language={language}
              textColor={settings.textColor}
              backgroundColor={settings.backgroundColor}
              onSelect={(preset) =>
                onChange({
                  ...settings,
                  textColor: preset.textColor,
                  backgroundColor: preset.backgroundColor,
                })
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Icons.cog}
        title={t.layout}
        description={t.layoutDesc}
        showDivider={false}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-[550] tracking-[-0.005em] text-white/75">
              {t.alignment}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {alignmentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={optionButtonClassName(
                    settings.horizontalAlignment === option.value
                  )}
                  aria-pressed={settings.horizontalAlignment === option.value}
                  onClick={() =>
                    onChange({
                      ...settings,
                      horizontalAlignment: option.value,
                    })
                  }
                >
                  <option.Icon className="h-5 w-5 opacity-95" />
                  <div className="text-[0.85rem] font-[650] text-white/90">
                    {option.label}
                  </div>
                  <div className="text-xs text-white/55">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="mt-2 flex h-[50px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-[1.5px] border-white/15 bg-white/[0.02] text-[1.05rem] font-bold text-white/90 transition-all duration-[250ms] hover:border-[rgba(74,144,226,0.5)] hover:bg-[rgba(74,144,226,0.1)] hover:text-[#5fa3ff] focus-visible:border-[rgba(74,144,226,0.5)] focus-visible:bg-[rgba(74,144,226,0.1)] focus-visible:text-[#5fa3ff]"
            onClick={onReset}
          >
            <Icons.rotateCcw className="h-5 w-5" />
            {t.reset}
          </button>
        </div>
      </SettingsSection>
    </SettingsDrawerShell>
  );
}
