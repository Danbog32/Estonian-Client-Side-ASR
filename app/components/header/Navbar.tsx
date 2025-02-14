// components/header/Navbar.jsx

"use client";

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded transition duration-300 disabled:opacity-50 flex items-center gap-1"
          >
            <Icons.play size={20} color="white" />
            {t.start}
          </button>
        </NavbarItem>
        <NavbarItem>
          <button
            id="stopBtn"
            disabled
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded transition duration-300 disabled:opacity-50 flex items-center gap-1"
          >
            <Icons.stop size={21} color="white" />
            {t.stop}
          </button>
        </NavbarItem>
        <NavbarItem>
          <button
            id="clearBtn"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded transition duration-300 flex items-center gap-1"
          >
            <Icons.delete size={21} color="white" />
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
            <Icons.play size={20} color="white" />
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
