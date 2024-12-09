import { Slider } from "@nextui-org/react";
import { Icons } from "../icons";
import { useSettings } from "../SettingsContext";

export default function TextSizeSlider() {
  const { lineHeight, setLineHeight, language } = useSettings() as {
    lineHeight: number;
    setLineHeight: (value: number) => void;
    language: "en" | "et";
  };

  const translations = {
    en: {
      lineHeight: "Line Height:",
    },
    et: {
      lineHeight: "Reavahe:",
    },
  };

  const t = translations[language];

  return (
    <div className="flex flex-col w-full max-w-md">
      <Slider
        size="lg"
        label={
          <div className="flex items-center gap-1">
            <Icons.text size={20} color="white" />
            {t.lineHeight}
          </div>
        }
        onChange={(value) =>
          setLineHeight(Array.isArray(value) ? value[0] : value)
        }
        step={0.2}
        color="primary"
        showSteps={true}
        maxValue={3}
        minValue={1}
        defaultValue={lineHeight}
        className="max-w-md"
      />
    </div>
  );
}
