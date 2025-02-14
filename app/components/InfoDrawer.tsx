"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  useDisclosure,
  Link,
} from "@heroui/react";
import { Icons } from "./icons";
import { useSettings } from "./SettingsContext";

export default function InfoDrawer() {
  const { isOpen, onOpenChange } = useDisclosure();
  const { language } = useSettings() as { language: "en" | "et" };

  const translations = {
    en: {
      header: "App Info",
      content: [
        "This web application listens to audio input and converts speech to text. The speech recognition engine runs directly in the browser. This means that the user's speech is not sent to a server, ensuring complete privacy.",
        "The application can also be used such that one computer listens to speech, recognizes it, and the recognized text is sent to devices connected to the session (see Settings).",
        "The application works only in Chrome. For best recognition results, it is recommended to use a microphone placed close to your mouth. Because the browser-based speech recognition model is small, it does not perform well in very spontaneous, noisy, or multi-speaker situations.",
      ],
      authorLabel: "Author:",
      authorText:
        "Bohdan Podziubanchuk, Tallinn University of Technology Language Technology Laboratory",
      close: "Close",
      button: "App info",
    },
    et: {
      header: "Rakenduse teave",
      content: [
        "See veebirakendus kuulab helisisendit ja konverteerib kõne tekstiks. Kõnetuvastusmootor jookseb otse brauseris. See tähendab, et kasutaja kõnet ei saadeta serverisse, tagades sellega täieliku privaatsuse.",
        "Rakendust saab kasutada ka nii, et üks arvuti kuulab kõnet, tuvastab selle ning tuvastatud tekst saadetakse antud sessiooniga ühendunud seadmetesse (vt Seaded).",
        "Rakendus toimib ainult Chrome brauseris. Hea kvaliteediga tuvastustulemuse saamiseks on soovitav kasutada suu lähedal olevat mikrofoni. Kuna brauseris kõnetuvastust võimaldav mudel on väike, ei toimi see hästi väga spontaansete, müraste või mitme rääkija samaaegse kõne puhul.",
      ],
      authorLabel: "Autor:",
      authorText:
        "Bohdan Podziubanchuk, Tallinna Tehnikaülikooli keeletehnoloogia labor",
      close: "Sulge",
      button: "Rakenduse teave",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Button
        onClick={onOpenChange}
        size="sm"
        className="text-white bg-gray-900 hover:bg-gray-800 transition duration-100 gap-1 min-w-0"
      >
        <Icons.info size={18} className="text-gray-300" />
        <span className="hidden sm:inline text-gray-300">{t.button}</span>
      </Button>

      <Drawer placement="right" isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-gray-900">
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1 text-white">
                <h2 className="text-2xl font-bold">{t.header}</h2>
              </DrawerHeader>
              <DrawerBody className="text-white">
                {t.content.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="text-sm sm:text-medium mb-4 whitespace-pre-line"
                  >
                    {paragraph}
                  </p>
                ))}
                <p className="text-md mb-4">
                  {t.authorLabel}{" "}
                  <Link
                    isExternal
                    href="https://taltech.ee/en/laboratory-language-technology"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-400 hover:text-blue-300"
                  >
                    {t.authorText}
                  </Link>
                </p>
              </DrawerBody>
              <DrawerFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {t.close}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
