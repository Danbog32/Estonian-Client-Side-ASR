// components/header/Navbar.jsx

"use client";

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@heroui/react";
import { TalTechLogo } from "./TalTechLogo.jsx";
import { Icons } from "../icons";
import Settings from "./Settings";
import { useSettings } from "../SettingsContext";

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);

  const { language }: { language: "en" | "et" } = useSettings();

  const translations = {
    en: {
      start: "Start",
      stop: "Stop",
      clear: "Clear",
    },
    et: {
      start: "Alusta",
      stop: "Peata",
      clear: "Puhasta",
    },
  };

  const t = translations[language as "en" | "et"] || translations.en;

  const handleButtonClick = () => {
    setIsRecording(!isRecording);
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");

    if (isRecording) {
      stopBtn?.click();
    } else {
      startBtn?.click();
    }
  };

  return (
    <Navbar
      onMenuOpenChange={setIsMenuOpen}
      className="bg-gray-900 bg-opacity-85"
    >
      <NavbarContent justify="start">
        <NavbarBrand>
          <Link
            href="https://taltech.ee/en/laboratory-language-technology"
            target="_blank"
            className="cursor-pointer"
          >
            <TalTechLogo />
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <button
            id="startBtn"
            disabled
            className="bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-medium px-4 py-2 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
          >
            <Icons.mic size={20} />
            {t.start}
          </button>
        </NavbarItem>
        <NavbarItem>
          <button
            id="stopBtn"
            disabled
            className="bg-danger hover:bg-danger/90 active:bg-danger/80 text-white font-medium px-4 py-2 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
          >
            <Icons.stop size={20} />
            {t.stop}
          </button>
        </NavbarItem>
        <NavbarItem>
          <button
            id="clearBtn"
            className="bg-default-500 hover:bg-default-600 active:bg-default-700 text-white font-medium px-4 py-2 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
          >
            <Icons.trash size={18} />
            {t.clear}
          </button>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent className="flex sm:hidden" justify="center">
        <NavbarItem>
          <button
            id="toggleBtn"
            onClick={handleButtonClick}
            className={`${
              isRecording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-bold px-4 py-2 rounded transition duration-300 flex items-center gap-1 ml-2`}
          >
            <Icons.mic size={20} color="white" />
            {isRecording ? t.stop : t.start}
          </button>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Settings />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
