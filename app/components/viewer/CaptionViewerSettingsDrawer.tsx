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
import styles from "./CaptionViewerSettingsDrawer.module.css";

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: CaptionViewerSettings;
  onChange: (next: CaptionViewerSettings) => void;
  onReset: () => void;
};

const colorPresets = [
  {
    key: "blackOnWhite",
    textColor: "#000000",
    backgroundColor: "#FFFFFF",
    label: { en: "Black on white", et: "Must valgel" },
  },
  {
    key: "whiteOnBlack",
    textColor: "#FFFFFF",
    backgroundColor: "#000000",
    label: { en: "White on black", et: "Valge mustal" },
  },
  {
    key: "yellowOnBlack",
    textColor: "#F8E71C",
    backgroundColor: "#000000",
    label: { en: "Yellow on black", et: "Kollane mustal" },
  },
  {
    key: "cyanOnDark",
    textColor: "#50E3C2",
    backgroundColor: "#0B0B0B",
    label: { en: "Cyan on dark", et: "Tsüaan tumedal" },
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
      viewModeCaptionsDesc: "Last 3 lines",
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
      viewModeCaptionsDesc: "Viimased 3 rida",
      viewModeTranscriptDesc: "Kogu tekst",
      typography: "Kirjastiil",
      fontSize: "Kirja suurus",
      lineHeight: "Reavahe",
      fontWeight: "Kirja paksus",
      letterSpacing: "Tähtevahe",
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
      <DrawerContent className={styles.drawer}>
        {(onClose) => (
          <>
            <DrawerHeader className={styles.header}>
              <div className={styles.headerContent}>
                <span className={styles.title}>{t.title}</span>
                <span className={styles.subtitle}>{t.subtitle}</span>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label={t.close}
              >
                <Icons.close className="w-5 h-5" />
              </button>
            </DrawerHeader>

            <DrawerBody className={styles.body}>
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}>
                    <Icons.textSelect className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>{t.typography}</h2>
                    <p className={styles.sectionDescription}>
                      {t.typographyDesc}
                    </p>
                  </div>
                </div>

                <div className={styles.controlGroup}>
                  <Slider
                    size="md"
                    label={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Icons.type className={styles.controlIcon} />
                          <span className={styles.controlLabel}>
                            {t.fontSize}
                          </span>
                        </div>
                        <span className={styles.valueBadge}>
                          {Math.round(settings.fontSizePx)}px
                        </span>
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
                          <Icons.gripVertical className={styles.controlIcon} />
                          <span className={styles.controlLabel}>
                            {t.lineHeight}
                          </span>
                        </div>
                        <span className={styles.valueBadge}>
                          {settings.lineHeight.toFixed(2)}
                        </span>
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
                          <Icons.wholeWord className={styles.controlIcon} />
                          <span className={styles.controlLabel}>
                            {t.letterSpacing}
                          </span>
                        </div>
                        <span className={styles.valueBadge}>
                          {settings.letterSpacingEm.toFixed(3)}em
                        </span>
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
                    <div className="flex flex-col gap-2">
                      {fontWeightOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={[
                            styles.optionButton,
                            settings.fontWeight === option.value
                              ? styles.optionButtonActive
                              : "",
                          ].join(" ")}
                          aria-pressed={settings.fontWeight === option.value}
                          onClick={() =>
                            onChange({ ...settings, fontWeight: option.value })
                          }
                        >
                          {option.value === 400 ? (
                            <span>Aa</span>
                          ) : (
                            <span className="font-bold">Aa</span>
                          )}
                          <span className={styles.optionLabel}>
                            {option.label}
                          </span>
                          <span className={styles.optionDescription}>
                            {option.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className={styles.divider} />

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}>
                    <Icons.palette className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>{t.colors}</h2>
                    <p className={styles.sectionDescription}>{t.colorsDesc}</p>
                  </div>
                </div>

                <div className={styles.controlGroup}>
                  <div className={styles.colorPickers}>
                    <label className={styles.colorPickerItem}>
                      <span className={styles.colorPickerLabel}>
                        {t.textColor}
                      </span>
                      <div
                        className={styles.colorSwatch}
                        style={{ backgroundColor: settings.textColor }}
                      >
                        <input
                          type="color"
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
                      <span className={styles.colorValue}>
                        {settings.textColor}
                      </span>
                    </label>

                    <label className={styles.colorPickerItem}>
                      <span className={styles.colorPickerLabel}>
                        {t.backgroundColor}
                      </span>
                      <div
                        className={styles.colorSwatch}
                        style={{ backgroundColor: settings.backgroundColor }}
                      >
                        <input
                          type="color"
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
                      <span className={styles.colorValue}>
                        {settings.backgroundColor}
                      </span>
                    </label>
                  </div>

                  <div>
                    <div className={styles.controlLabel}>{t.presets}</div>
                    <div className={styles.colorPresets}>
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          className={styles.colorPresetCard}
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
                            className={styles.presetPreview}
                            style={{
                              backgroundColor: preset.backgroundColor,
                              color: preset.textColor,
                            }}
                          >
                            Aa
                          </div>
                          <div className={styles.presetLabel}>
                            {preset.label[language] ?? preset.label.en}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className={styles.divider} />

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}>
                    <Icons.cog className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>{t.layout}</h2>
                    <p className={styles.sectionDescription}>{t.layoutDesc}</p>
                  </div>
                </div>

                <div className={styles.controlGroup}>
                  <div>
                    <div className={styles.controlLabel}>{t.alignment}</div>
                    <div className={styles.alignmentGrid}>
                      {alignmentOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={[
                            styles.alignmentButton,
                            settings.horizontalAlignment === option.value
                              ? styles.alignmentButtonActive
                              : "",
                          ].join(" ")}
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
                          <option.Icon className={styles.alignmentIcon} />
                          <div className={styles.alignmentLabel}>
                            {option.label}
                          </div>
                          <div className={styles.alignmentDescription}>
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={onReset}
                >
                  <Icons.rotateCcw className={styles.resetIcon} />
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
