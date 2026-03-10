import { Slider } from "@heroui/react";
import { Icons } from "../icons";
import { useSettings } from "../../providers/SettingsContext";

export default function TextSizeSlider() {
  const { fontSizePx, setFontSizePx, language } = useSettings();

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
    <div className="flex flex-col min-w-full">
      <Slider
        size="lg"
        label={
          <div className="flex items-center gap-1">
            <Icons.textSelect size={20} color="white" />
            {t.textSize}
          </div>
        }
        step={2}
        color="primary"
        showSteps={true}
        maxValue={96}
        minValue={16}
        defaultValue={fontSizePx}
        onChange={(value) =>
          setFontSizePx(Array.isArray(value) ? value[0] : value)
        }
      />
    </div>
  );
}
