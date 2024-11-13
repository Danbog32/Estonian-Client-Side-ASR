// components/header/Settings.jsx

"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  ScrollShadow,
} from "@nextui-org/react";
import { Icons } from "../icons";
import { useSettings } from "../SettingsContext";
import ZoomApiSwitchComponent from "./ZoomApiSwitchComponent";
import FirebaseApiSwitchComponent from "./FirebaseApiSwitchComponent";

export default function Settings() {
  const {
    textSize,
    setTextSize,
    lineHeight,
    setLineHeight,
    subtitleMode,
    setSubtitleMode,
    language,
    setLanguage,
  } = useSettings();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [backdrop, setBackdrop] = React.useState("opaque");

  const handleOpen = () => {
    setBackdrop("opaque");
    onOpen();
  };

  const handleTextSizeChange = (increment) => {
    setTextSize((prevSize) => {
      const newSize = increment ? prevSize + 0.5 : prevSize - 0.5;
      return Math.max(1, Math.min(newSize, 8));
    });
  };

  const handleLineHeightChange = (increment) => {
    setLineHeight((prevHeight) => {
      const newHeight = increment ? prevHeight + 0.1 : prevHeight - 0.1;
      return Math.max(1, Math.min(newHeight, 3));
    });
  };

  const handleModeChange = (mode) => {
    setSubtitleMode(mode === "subtitle");
    // Update the global subtitle mode in app-asr.js
    if (window.setSubtitleMode) {
      window.setSubtitleMode(mode === "subtitle");
    }
  };

  const translations = {
    en: {
      settings: "Settings",
      textSize: "Text Size:",
      lineHeight: "Line Height:",
      subtitleMode: "Subtitle Mode:",
      textMode: "Text Mode",
      subtitleModeButton: "Subtitle Mode",
      languageLabel: "Language:",
      close: "Close",
    },
    et: {
      settings: "Seaded",
      textSize: "Teksti suurus:",
      lineHeight: "Reavahe:",
      subtitleMode: "Subtiitrite režiim:",
      textMode: "Tekstirežiim",
      subtitleModeButton: "Subtiitrite režiim",
      languageLabel: "Keel:",
      close: "Sulge",
    },
  };

  const t = translations[language];

  return (
    <div className="dark">
      <div className="flex flex-wrap gap-0 sm:gap-3">
        <Button
          variant="bordered"
          onClick={handleOpen}
          color="light"
          className="text-white bg-gray-900 hover:bg-gray-800 transition duration-100 gap-1 min-w-0"
        >
          <Icons.settings size={20} color="white" />
          <span className="hidden sm:inline">{t.settings}</span>
        </Button>
      </div>
      <Modal backdrop={backdrop} isOpen={isOpen} onClose={onClose}>
        <ModalContent className="bg-gray-800 text-white max-h-[90dvh] ">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-white">
                {t.settings}
              </ModalHeader>
              <ScrollShadow hideScrollBar className="flex-1">
                <ModalBody className="text-gray-300 overflow-auto">
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex gap-1 items-center">
                      <Icons.textSelect size={20} color="white" />
                      {t.textSize}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="bordered"
                        onClick={() => handleTextSizeChange(false)}
                        className="text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        isDisabled
                        variant="bordered"
                        value={textSize.toFixed(1)}
                        size="small"
                        onChange={(e) =>
                          setTextSize(
                            Math.max(1, Math.min(parseFloat(e.target.value), 8))
                          )
                        }
                      />
                      <Button
                        variant="bordered"
                        onClick={() => handleTextSizeChange(true)}
                        className="text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
                      >
                        +
                      </Button>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Icons.text size={20} color="white" />
                      {t.lineHeight}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="bordered"
                        onClick={() => handleLineHeightChange(false)}
                        className="text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        isDisabled
                        variant="bordered"
                        value={lineHeight.toFixed(1)}
                        onChange={(e) =>
                          setLineHeight(
                            Math.max(1, Math.min(parseFloat(e.target.value), 3))
                          )
                        }
                      />
                      <Button
                        variant="bordered"
                        onClick={() => handleLineHeightChange(true)}
                        className="text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
                      >
                        +
                      </Button>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Icons.wholeWord size={20} color="white" />
                      {t.subtitleMode}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={!subtitleMode ? "bordered" : "solid"}
                        onClick={() => handleModeChange("text")}
                        className={`text-white ${
                          subtitleMode
                            ? "bg-gray-900 hover:bg-gray-800"
                            : "bg-gray-700 hover:bg-gray-800"
                        } transition duration-100`}
                      >
                        {t.textMode}
                      </Button>
                      <Button
                        variant={subtitleMode ? "bordered" : "solid"}
                        onClick={() => handleModeChange("subtitle")}
                        className={`text-white ${
                          !subtitleMode
                            ? "bg-gray-900 hover:bg-gray-800"
                            : "bg-gray-700 hover:bg-gray-800"
                        } transition duration-100`}
                      >
                        {t.subtitleModeButton}
                      </Button>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Icons.languages size={20} color="white" />
                      {t.languageLabel}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant={language === "en" ? "bordered" : "solid"}
                        onClick={() => setLanguage("en")}
                        className={`text-white ${
                          language !== "en"
                            ? "bg-gray-900 hover:bg-gray-800"
                            : "bg-gray-700 hover:bg-gray-800"
                        } transition duration-100`}
                      >
                        English
                      </Button>
                      <Button
                        variant={language === "et" ? "bordered" : "solid"}
                        onClick={() => setLanguage("et")}
                        className={`text-white ${
                          language !== "et"
                            ? "bg-gray-900 hover:bg-gray-800"
                            : "bg-gray-700 hover:bg-gray-800"
                        } transition duration-100`}
                      >
                        Eesti
                      </Button>
                    </div>
                    <ZoomApiSwitchComponent />
                    <FirebaseApiSwitchComponent />
                  </div>
                </ModalBody>
              </ScrollShadow>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  {t.close}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
