"use client";

import { ExternalLink, Github } from "lucide-react";
import { useSettings } from "../providers/SettingsContext";
import FirebaseApiSwitchComponent from "./header/FirebaseApiSwitchComponent";
import { Icons } from "./icons";
import {
  SettingsColorInput,
  SettingsDrawerShell,
  SettingsPresetGrid,
  SettingsSection,
  SettingsSliderField,
} from "./settings/SettingsDrawerPrimitives";
import { SHARED_COLOR_PRESETS } from "./settings/sharedColorPresets";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({
  isOpen,
  onClose,
}: SettingsDrawerProps) {
  const {
    fontSizePx,
    setFontSizePx,
    lineHeight,
    setLineHeight,
    textColor,
    setTextColor,
    backgroundColor,
    setBackgroundColor,
    language,
    setLanguage,
  } = useSettings();

  const translations = {
    en: {
      settings: "Settings",
      subtitle: "Customize your experience",
      typography: "Typography",
      typographyDesc: "Adjust font size and line height",
      fontSize: "Font size",
      lineHeight: "Line height",
      colors: "Colors",
      colorsDesc: "Choose your preferred text and background",
      textColor: "Text",
      backgroundColor: "Background",
      presets: "Color presets",
      language: "Language",
      languageDesc: "Select the interface language",
      sharing: "Sharing",
      sharingDesc: "Let others follow along live",
      about: "About",
      aboutDesc:
        "Free Estonian speech-to-text that runs entirely in your browser. No login",
      author: "Bohdan Podziubanchuk",
      authorRole: "TalTech Language Technology Lab",
      github: "Source code",
      learnMore: "Learn more",
      close: "Close",
      estonian: "Eesti",
      english: "English",
    },
    et: {
      settings: "Seaded",
      subtitle: "Kohanda oma kogemust",
      typography: "Kirjastiil",
      typographyDesc: "Muuda teksti suurust ja reavahet",
      fontSize: "Teksti suurus",
      lineHeight: "Reavahe",
      colors: "Värvid",
      colorsDesc: "Vali teksti ja tausta eelistatud ilme",
      textColor: "Tekst",
      backgroundColor: "Taust",
      presets: "Värvi eelseaded",
      language: "Keel",
      languageDesc: "Vali kasutajaliidese keel",
      sharing: "Jagamine",
      sharingDesc: "Lase teistel reaalajas kaasa vaadata",
      about: "Rakenduse teave",
      aboutDesc:
        "Tasuta eesti kõnetuvastus, mis töötab täielikult brauseris. Ilma sisselogimiseta",
      author: "Bohdan Podziubanchuk",
      authorRole: "TalTech keeletehnoloogia labor",
      github: "Lähtekood",
      learnMore: "Loe lähemalt",
      close: "Sulge",
      estonian: "Eesti",
      english: "English",
    },
  } as const;

  const t = translations[language] ?? translations.en;

  return (
    <SettingsDrawerShell
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t.settings}
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
            valueLabel={`${fontSizePx}px`}
            minValue={16}
            maxValue={96}
            step={2}
            value={fontSizePx}
            onChange={setFontSizePx}
            minLabel="16"
            maxLabel="96"
          />

          <SettingsSliderField
            icon={Icons.gripVertical}
            label={t.lineHeight}
            valueLabel={lineHeight.toFixed(2)}
            minValue={1}
            maxValue={3}
            step={0.05}
            value={lineHeight}
            onChange={setLineHeight}
            minLabel="1"
            maxLabel="3"
          />
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
              value={textColor}
              onChange={setTextColor}
            />
            <SettingsColorInput
              label={t.backgroundColor}
              value={backgroundColor}
              onChange={setBackgroundColor}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm font-[550] tracking-[-0.005em] text-white/75">
              {t.presets}
            </div>
            <SettingsPresetGrid
              presets={SHARED_COLOR_PRESETS}
              language={language}
              textColor={textColor}
              backgroundColor={backgroundColor}
              onSelect={(preset) => {
                setTextColor(preset.textColor);
                setBackgroundColor(preset.backgroundColor);
              }}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Icons.languages}
        title={t.language}
        description={t.languageDesc}
      >
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { key: "et", label: t.estonian },
              { key: "en", label: t.english },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              className={` rounded-[14px] border-[1.5px] px-4 py-3 text-base font-[700] transition-all duration-[250ms] ${
                language === option.key
                  ? "border-[rgba(74,144,226,0.95)] bg-gradient-to-br from-[rgba(74,144,226,0.18)] to-[rgba(74,144,226,0.08)] text-white shadow-[0_0_0_1px_rgba(74,144,226,0.2)]"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:-translate-y-px hover:border-[rgba(74,144,226,0.4)] hover:bg-white/[0.05]"
              }`}
              aria-pressed={language === option.key}
              onClick={() => setLanguage(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Icons.cloud}
        title={t.sharing}
        description={t.sharingDesc}
      >
        <FirebaseApiSwitchComponent />
      </SettingsSection>

      <SettingsSection
        icon={Icons.info}
        title={t.about}
        description={t.aboutDesc}
        showDivider={false}
      >
        <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center gap-3.5">
            <div>
              <div className="text-sm font-[650] text-white/90">{t.author}</div>
              <div className="text-[0.8rem] text-white/50">{t.authorRole}</div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <a
              href="https://taltech.ee/en/laboratory-language-technology"
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-[0.8rem] font-[600] text-white/70 transition-all hover:bg-white/[0.1] hover:text-white/90"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t.learnMore}
            </a>
            <a
              href="https://github.com/Danbog32/Estonian-Client-Side-ASR"
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-[0.8rem] font-[600] text-white/70 transition-all hover:bg-white/[0.1] hover:text-white/90"
            >
              <Github className="h-3.5 w-3.5" />
              {t.github}
            </a>
          </div>
        </div>
      </SettingsSection>
    </SettingsDrawerShell>
  );
}
