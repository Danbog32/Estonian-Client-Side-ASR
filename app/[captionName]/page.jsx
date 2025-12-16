// [captionName]/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../firebaseConfig"; // Adjust the path if necessary
import { doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { ScrollShadow, Tooltip, Button, useDisclosure } from "@heroui/react";
import { Icons } from "../components/icons";
import CaptionViewerSettingsDrawer from "../components/viewer/CaptionViewerSettingsDrawer";
import CaptionViewerDisplay from "../components/viewer/CaptionViewerDisplay";
import { useCaptionViewerSettings } from "../components/viewer/useCaptionViewerSettings";

export default function LiveCaptionsPage() {
  const params = useParams();
  const captionName = params.captionName;
  const [captionText, setCaptionText] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const scrollRef = useRef(null);
  const { isOpen, onOpenChange } = useDisclosure();
  const { settings, setSettings, resetSettings } = useCaptionViewerSettings();

  useEffect(() => {
    if (!captionName) return;

    const captionDoc = doc(db, "captions", captionName);
    const unsubscribe = onSnapshot(captionDoc, (doc) => {
      if (doc.exists()) {
        setCaptionText(doc.data().text);
      } else {
        setCaptionText("No captions available.");
      }
    });

    return () => unsubscribe();
  }, [captionName]);

  // Auto-scroll to bottom when caption text updates
  useEffect(() => {
    if (settings.viewMode !== "transcript") return;
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [captionText, settings.viewMode]);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(captionText || "");
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch (e) {
      console.error("Failed to copy text", e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch (e) {
      console.error("Failed to copy link", e);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-4 p-4 md:p-8">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <Image
              src="/images/TalTech_logo.png"
              alt="Logo"
              width={90}
              height={64}
              className="opacity-90 drop-shadow-xl"
            />
            <div>
              <h1 className="text-base md:text-lg font-semibold text-white">
                Live Captions
              </h1>
              <p className="text-xs md:text-sm text-gray-300/70">
                Shareable real-time transcript
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Display settings" showArrow={true}>
              <Button
                onPress={onOpenChange}
                size="sm"
                className="border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
              >
                <div className="flex items-center gap-1">
                  <Icons.settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </div>
              </Button>
            </Tooltip>
            <Tooltip
              content={copiedLink ? "Link copied" : "Copy share link"}
              showArrow={true}
            >
              <Button
                onPress={handleCopyLink}
                size="sm"
                className="border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
              >
                {copiedLink ? (
                  <div className="flex items-center gap-1">
                    <Icons.check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Icons.link className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy link</span>
                  </div>
                )}
              </Button>
            </Tooltip>
            <Tooltip
              content={copiedAll ? "Text copied" : "Copy all text"}
              showArrow={true}
            >
              <Button
                onPress={handleCopyAll}
                size="sm"
                className="border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
              >
                {copiedAll ? (
                  <div className="flex items-center gap-1">
                    <Icons.check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Icons.copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy all</span>
                  </div>
                )}
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Display */}
        {settings.viewMode === "transcript" ? (
          <div className="w-full flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/10 shadow-lg">
            <div className="flex items-center gap-2 border-b border-white/10 bg-black/10 px-3 py-2 md:px-4 md:py-3">
              <Icons.languages className="w-4 h-4 text-blue-300" />
              <h3 className="text-sm font-medium text-gray-200 md:text-base">
                Live transcript
              </h3>
            </div>
            <ScrollShadow className="overflow-auto p-4" ref={scrollRef}>
              <CaptionViewerDisplay
                text={captionText}
                settings={settings}
                placeholder="Waiting for captions…"
              />
            </ScrollShadow>
          </div>
        ) : (
          <div className="flex flex-1 items-center pb-10 md:pb-14">
            <CaptionViewerDisplay
              text={captionText}
              settings={settings}
              placeholder="Waiting for captions…"
            />
          </div>
        )}
      </div>

      <CaptionViewerSettingsDrawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        settings={settings}
        onChange={setSettings}
        onReset={resetSettings}
      />
    </div>
  );
}
