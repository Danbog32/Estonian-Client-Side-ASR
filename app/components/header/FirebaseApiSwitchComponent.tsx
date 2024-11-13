// components/FirebaseApiSwitchComponent.jsx

"use client";

import { Switch, cn } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { useSettings } from "../SettingsContext";
import QRCode from "react-qr-code";
import { Icons } from "../icons";

declare global {
  interface Window {
    setFirebaseSettings?: (enabled: boolean, captionName: string) => void;
  }
}

export default function FirebaseApiSwitchComponent() {
  const {
    firebaseEnabled,
    setFirebaseEnabled,
    captionName,
    setCaptionName,
    captionURL,
    setCaptionURL,
    language,
  } = useSettings();

  const [showQRCode, setShowQRCode] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const translations = {
    en: {
      castCaptions: "Cast captions to multiple people",
      captionsWillBeSent:
        "Captions will be sent to multiple people who have the link.",
      yourLiveCaptions: "Your live captions are available at:",
      hideQRCode: "Hide QR Code",
      showQRCode: "Show QR Code",
      linkCopied: "Link copied to clipboard!",
      failedToCopy: "Failed to copy link",
      clickToCopy: "Click to copy the link",
    },
    et: {
      castCaptions: "Saada subtiitrid mitmele inimesele",
      captionsWillBeSent:
        "Subtiitrid saadetakse mitmele inimesele, kellel on link.",
      yourLiveCaptions: "Teie otse subtiitrid on saadaval aadressil:",
      hideQRCode: "Peida QR-kood",
      showQRCode: "Näita QR-koodi",
      linkCopied: "Link kopeeritud lõikelauale!",
      failedToCopy: "Lingi kopeerimine ebaõnnestus",
      clickToCopy: "Klõpsake lingi kopeerimiseks",
    },
  };

  const t =
    translations[language as keyof typeof translations] || translations.en;

  // Function to update Firebase settings in app-asr.js
  const updateFirebaseSettings = (enabled: boolean, name: string) => {
    if (window.setFirebaseSettings) {
      window.setFirebaseSettings(enabled, name);
    }
  };

  // Function to generate a unique caption name
  const generateCaptionName = () => {
    const uniqueId = `caption-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;
    return uniqueId;
  };

  // Effect to handle firebaseEnabled changes
  useEffect(() => {
    if (firebaseEnabled) {
      // Generate captionName and captionURL if not already generated
      if (!captionName) {
        const name = generateCaptionName();
        setCaptionName(name);
        const url = `${window.location.origin}/${name}`;
        setCaptionURL(url);
        // Update Firebase settings in app-asr.js
        updateFirebaseSettings(firebaseEnabled, name);
      }
    } else {
      setCaptionName("");
      setCaptionURL("");
      // Update Firebase settings in app-asr.js
      updateFirebaseSettings(firebaseEnabled, "");
    }
  }, [captionName, firebaseEnabled, setCaptionName, setCaptionURL]);

  // Function to handle QR code click
  const handleQRCodeClick = () => {
    if (navigator.clipboard && window.isSecureContext) {
      // Use navigator.clipboard API
      navigator.clipboard.writeText(captionURL).then(
        () => {
          setCopyMessage(t.linkCopied);
          setTimeout(() => setCopyMessage(""), 2000);
        },
        () => {
          setCopyMessage(t.failedToCopy);
          setTimeout(() => setCopyMessage(""), 2000);
        }
      );
    } else {
      // Fallback method using a temporary textarea
      const textArea = document.createElement("textarea");
      textArea.value = captionURL;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopyMessage(t.linkCopied);
      } catch (err) {
        setCopyMessage(t.failedToCopy);
      } finally {
        textArea.remove();
        setTimeout(() => setCopyMessage(""), 2000);
      }
    }
  };

  // Functions to handle tooltip visibility for non-touch devices
  const handleQRCodeMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleQRCodeMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Switch
        style={{ touchAction: "pan-y" }}
        isSelected={firebaseEnabled}
        onChange={(e) => setFirebaseEnabled(e.target.checked)}
        classNames={{
          base: cn(
            "inline-flex flex-row-reverse w-full max-w-md bg-gray-900 hover:bg-gray-800 hover:border-dashed items-center",
            "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-gray-900",
            "data-[selected=true]:border-white data-[selected=true]:bg-gray-700"
          ),
          wrapper: "p-0 h-4 overflow-visible",
          thumb: cn(
            "w-6 h-6 border-2 shadow-lg",
            "group-data-[hover=true]:border-white",
            // selected
            "group-data-[selected=true]:ml-6",
            // pressed
            "group-data-[pressed=true]:w-7",
            "group-data-[selected]:group-data-[pressed]:ml-4"
          ),
        }}
      >
        <div className="flex flex-col gap-1">
          <p className="text-medium text-white">{t.castCaptions}</p>
          <p className="text-tiny text-white">{t.captionsWillBeSent}</p>
        </div>
      </Switch>
      {firebaseEnabled && captionURL && (
        <div className="flex flex-col mt-1 gap-2 bg-gray-900 rounded-lg p-3">
          <p className="text-white">{t.yourLiveCaptions}</p>
          <a
            href={captionURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 break-all"
          >
            {captionURL}
          </a>
          <div className="mt-2">
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className="text-white hover:text-blue-500 flex items-center"
            >
              <Icons.qrCode className="mr-2" />
              {showQRCode ? t.hideQRCode : t.showQRCode}
            </button>
          </div>
          {showQRCode && (
            <div
              className="mt-2 flex flex-col items-center bg-white p-2 rounded cursor-pointer relative"
              style={{ touchAction: "pan-y" }}
              onClick={handleQRCodeClick}
              onMouseEnter={handleQRCodeMouseEnter}
              onMouseLeave={handleQRCodeMouseLeave}
            >
              {showTooltip && (
                <div className="absolute bottom-full mb-2 text-sm bg-black text-white py-1 px-2 rounded-md hidden md:block">
                  {copyMessage ? t.linkCopied : t.clickToCopy}
                </div>
              )}
              <QRCode value={captionURL} size={180} />
              {copyMessage && (
                <div className="absolute bottom-full mb-2 text-sm bg-black text-green-500 py-1 px-2 rounded-md text-sm">
                  {copyMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
