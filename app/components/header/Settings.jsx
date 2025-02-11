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
// import FocusModeToggle from "./FocusModeToggle";
import TextSizeSlider from "./TextSizeSlider";
import LineHeightSlider from "./LineHeightSlider";
import ZoomApiSwitchComponent from "./ZoomApiSwitchComponent";
import FirebaseApiSwitchComponent from "./FirebaseApiSwitchComponent";

export default function Settings() {
  const { subtitleMode, setSubtitleMode, language, setLanguage } =
    useSettings();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [backdrop, setBackdrop] = React.useState("opaque");

  const handleOpen = () => {
    setBackdrop("opaque");
    onOpen();
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
      subtitleMode: "Subtitle Mode:",
      textMode: "Text Mode",
      subtitleModeButton: "Subtitle Mode",
      languageLabel: "Language:",
      close: "Close",
    },
    et: {
      settings: "Seaded",
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
      <div className="flex flex-wrap gap-0 sm:gap-3 z-[2]">
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
                  <div className="flex flex-col gap-5 mb-4">
                    <TextSizeSlider />
                    <LineHeightSlider />
                    <div className="flex flex-col gap-2">
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
                              ? "bg-gray-900 hover:bg-gray-800 border-2 border-gray-900 hover:border-dashed"
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
                              ? "bg-gray-900 hover:bg-gray-800 border-2 border-gray-900 hover:border-dashed"
                              : "bg-gray-700 hover:bg-gray-800"
                          } transition duration-100`}
                        >
                          {t.subtitleModeButton}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
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
                              ? "bg-gray-900 hover:bg-gray-800 border-2 border-gray-900 hover:border-dashed"
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
                              ? "bg-gray-900 hover:bg-gray-800 border-2 border-gray-900 hover:border-dashed"
                              : "bg-gray-700 hover:bg-gray-800"
                          } transition duration-100`}
                        >
                          Eesti
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      {/* <FocusModeToggle /> */}
                      <ZoomApiSwitchComponent />
                      <FirebaseApiSwitchComponent />
                    </div>
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
