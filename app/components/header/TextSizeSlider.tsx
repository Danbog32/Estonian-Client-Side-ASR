import { Slider } from "@heroui/react";
import { Icons } from "../icons";
import { useSettings } from "../SettingsContext";

export default function TextSizeSlider() {
  const { textSize, setTextSize, language } = useSettings() as {
    textSize: number;
    setTextSize: (value: number) => void;
    language: "en" | "et";
  };

  const translations = {
    en: {
      textSize: "Text Size:",
    },
    et: {
      textSize: "Teksti suurus:",
    },
  };

  const t = translations[language];

  return (
    <div className="flex flex-col w-full max-w-md">
      <Slider
        size="lg"
        label={
          <div className="flex items-center gap-1">
            <Icons.textSelect size={20} color="white" />
            {t.textSize}
          </div>
        }
        step={0.5}
        color="primary"
        showSteps={true}
        maxValue={8}
        minValue={1}
        defaultValue={textSize}
        onChange={(value) =>
          setTextSize(Array.isArray(value) ? value[0] : value)
        }
        className="max-w-md"
      />
    </div>
  );
}
